import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { login } from "./services/auth";
import { triageTicket } from "./services/agent";
import { authenticateToken, requireRole, requireAuth, type AuthenticatedRequest } from "./middleware/auth";
import { createAuditLog } from "./utils/audit";
import { 
  insertUserSchema, 
  loginSchema, 
  insertTicketSchema, 
  insertArticleSchema,
  insertConfigSchema 
} from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting
  app.use("/api/auth", authLimiter);
  app.use("/api", generalLimiter);

  // Health checks
  app.get("/healthz", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/readyz", (req, res) => {
    res.json({ status: "ready", timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { passwordHash, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await login(credentials);
      
      if (!result) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // KB routes
  app.get("/api/kb", async (req, res) => {
    try {
      const { query, status } = req.query;
      const articles = await storage.getArticles(
        query as string, 
        status as string
      );
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.post("/api/kb", authenticateToken, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const articleData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put("/api/kb/:id", authenticateToken, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertArticleSchema.partial().parse(req.body);
      const article = await storage.updateArticle(id, updates);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/kb/:id", authenticateToken, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteArticle(id);
      
      if (!success) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, category, my } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (my === "true") filters.createdBy = req.user!.userId;
      
      const tickets = await storage.getTickets(filters);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check if user can access this ticket
      const canAccess = ticket.createdByUser.id === req.user!.userId || 
                       req.user!.role === "admin" || 
                       req.user!.role === "agent";
      
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post("/api/tickets", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketData = insertTicketSchema.parse({
        ...req.body,
        createdBy: req.user!.userId,
      });
      
      const ticket = await storage.createTicket(ticketData);
      
      // Log ticket creation
      await createAuditLog({
        ticketId: ticket.id,
        traceId: ticket.id, // Use ticket ID as initial trace ID
        actor: "user",
        action: "TICKET_CREATED",
        meta: {
          title: ticket.title,
          category: ticket.category,
          createdBy: req.user!.userId,
        },
      });
      
      // Trigger asynchronous triage (don't wait for it)
      triageTicket(ticket.id).catch(error => {
        console.error("Triage failed for ticket", ticket.id, error);
      });
      
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  app.post("/api/tickets/:id/reply", authenticateToken, requireRole(["admin", "agent"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { content, status } = req.body;
      
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Reply content is required" });
      }
      
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Create reply
      await storage.createTicketReply({
        ticketId: id,
        authorId: req.user!.userId,
        authorType: "agent",
        content,
      });
      
      // Update ticket status if provided
      if (status) {
        await storage.updateTicket(id, { status });
      }
      
      // Log the reply
      await createAuditLog({
        ticketId: id,
        traceId: `reply-${Date.now()}`,
        actor: "agent",
        action: "REPLY_SENT",
        meta: {
          agentId: req.user!.userId,
          contentLength: content.length,
          newStatus: status,
        },
      });
      
      res.json({ message: "Reply sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  app.post("/api/tickets/:id/assign", authenticateToken, requireRole(["admin", "agent"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;
      
      const ticket = await storage.updateTicket(id, { 
        assignee: assigneeId,
        status: "triaged"
      });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      await createAuditLog({
        ticketId: id,
        traceId: `assign-${Date.now()}`,
        actor: "agent",
        action: "TICKET_ASSIGNED",
        meta: {
          assignedBy: req.user!.userId,
          assignedTo: assigneeId,
        },
      });
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign ticket" });
    }
  });

  // Agent suggestion routes
  app.get("/api/agent/suggestion/:ticketId", authenticateToken, requireRole(["admin", "agent"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { ticketId } = req.params;
      const suggestion = await storage.getAgentSuggestion(ticketId);
      
      if (!suggestion) {
        return res.status(404).json({ message: "No suggestion found for this ticket" });
      }
      
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestion" });
    }
  });

  // Config routes
  app.get("/api/config", authenticateToken, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  app.put("/api/config", authenticateToken, requireRole(["admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const updates = insertConfigSchema.partial().parse(req.body);
      const config = await storage.updateConfig(updates);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update config" });
    }
  });

  // Audit routes
  app.get("/api/tickets/:id/audit", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Check if user can access this ticket's audit logs
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const canAccess = ticket.createdByUser.id === req.user!.userId || 
                       req.user!.role === "admin" || 
                       req.user!.role === "agent";
      
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const auditLogs = await storage.getAuditLogs(id);
      res.json(auditLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Manual triage trigger (for testing)
  app.post("/api/agent/triage/:ticketId", authenticateToken, requireRole(["admin", "agent"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { ticketId } = req.params;
      
      await triageTicket(ticketId);
      
      res.json({ message: "Triage completed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Triage failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
