import { 
  type User, 
  type InsertUser, 
  type Article, 
  type InsertArticle,
  type Ticket,
  type InsertTicket,
  type TicketWithDetails,
  type AgentSuggestion,
  type InsertAgentSuggestion,
  type AuditLog,
  type InsertAuditLog,
  type Config,
  type InsertConfig,
  type TicketReply,
  type InsertTicketReply,
  type DashboardStats
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Articles
  getArticles(query?: string, status?: string): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;
  
  // Tickets
  getTickets(filters?: { status?: string; category?: string; createdBy?: string }): Promise<TicketWithDetails[]>;
  getTicket(id: string): Promise<TicketWithDetails | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined>;
  
  // Agent Suggestions
  createAgentSuggestion(suggestion: InsertAgentSuggestion): Promise<AgentSuggestion>;
  getAgentSuggestion(ticketId: string): Promise<AgentSuggestion | undefined>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(ticketId: string): Promise<AuditLog[]>;
  
  // Config
  getConfig(): Promise<Config>;
  updateConfig(config: Partial<InsertConfig>): Promise<Config>;
  
  // Ticket Replies
  createTicketReply(reply: InsertTicketReply): Promise<TicketReply>;
  getTicketReplies(ticketId: string): Promise<TicketReply[]>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Search
  searchKB(query: string): Promise<Article[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private articles: Map<string, Article> = new Map();
  private tickets: Map<string, Ticket> = new Map();
  private agentSuggestions: Map<string, AgentSuggestion> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private ticketReplies: Map<string, TicketReply> = new Map();
  private config: Config;

  constructor() {
    this.config = {
      id: randomUUID(),
      autoCloseEnabled: true,
      confidenceThreshold: 0.78,
      slaHours: 24,
    };
    
    // Seed initial data
    this.seedData();
  }

  private async seedData() {
    // Create admin user
    const adminUser = await this.createUser({
      name: "Admin User",
      email: "admin@helpdesk.com",
      password: "admin123",
      role: "admin",
    });

    // Create agent user
    const agentUser = await this.createUser({
      name: "Sarah Chen",
      email: "agent@helpdesk.com", 
      password: "agent123",
      role: "agent",
    });

    // Create regular user
    const regularUser = await this.createUser({
      name: "John Doe",
      email: "user@helpdesk.com",
      password: "user123",
      role: "user",
    });

    // Create KB articles
    const articles = [
      {
        title: "How to update payment method",
        body: "Follow these steps to update your payment information: 1. Go to Account Settings 2. Click on Billing 3. Select Payment Methods 4. Add or edit your payment information 5. Save changes",
        tags: ["billing", "payments"],
        status: "published" as const,
      },
      {
        title: "Troubleshooting 500 errors",
        body: "If you encounter a 500 error: 1. Clear your browser cache 2. Try a different browser 3. Check our status page 4. If the issue persists, contact support with the error details",
        tags: ["technical", "errors"],
        status: "published" as const,
      },
      {
        title: "Tracking your shipment", 
        body: "To track your package: 1. Check your email for tracking information 2. Visit our shipping partner's website 3. Enter your tracking number 4. Contact support if tracking shows no updates for 5+ days",
        tags: ["shipping", "delivery"],
        status: "published" as const,
      }
    ];

    for (const article of articles) {
      await this.createArticle(article);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      passwordHash,
      role: insertUser.role || "user",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getArticles(query?: string, status?: string): Promise<Article[]> {
    let articles = Array.from(this.articles.values());
    
    if (status) {
      articles = articles.filter(article => article.status === status);
    }
    
    if (query) {
      const searchTerm = query.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.body.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    return articles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const now = new Date();
    const article: Article = {
      ...insertArticle,
      id,
      status: insertArticle.status || "draft",
      tags: insertArticle.tags || [],
      createdAt: now,
      updatedAt: now,
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticle(id: string, updates: Partial<InsertArticle>): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;

    const updatedArticle: Article = {
      ...article,
      ...updates,
      updatedAt: new Date(),
    };
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteArticle(id: string): Promise<boolean> {
    return this.articles.delete(id);
  }

  async getTickets(filters?: { status?: string; category?: string; createdBy?: string }): Promise<TicketWithDetails[]> {
    let tickets = Array.from(this.tickets.values());
    
    if (filters?.status) {
      tickets = tickets.filter(ticket => ticket.status === filters.status);
    }
    if (filters?.category) {
      tickets = tickets.filter(ticket => ticket.category === filters.category);
    }
    if (filters?.createdBy) {
      tickets = tickets.filter(ticket => ticket.createdBy === filters.createdBy);
    }
    
    // Enrich with related data
    const enrichedTickets: TicketWithDetails[] = [];
    for (const ticket of tickets) {
      const createdByUser = await this.getUser(ticket.createdBy);
      const assigneeUser = ticket.assignee ? await this.getUser(ticket.assignee) : undefined;
      const agentSuggestion = ticket.agentSuggestionId ? 
        Array.from(this.agentSuggestions.values()).find(s => s.id === ticket.agentSuggestionId) : undefined;
      const replies = await this.getTicketReplies(ticket.id);
      
      enrichedTickets.push({
        ...ticket,
        createdByUser: createdByUser ? {
          id: createdByUser.id,
          name: createdByUser.name,
          email: createdByUser.email,
        } : { id: ticket.createdBy, name: "Unknown", email: "unknown@email.com" },
        assigneeUser: assigneeUser ? {
          id: assigneeUser.id,
          name: assigneeUser.name,
          email: assigneeUser.email,
        } : undefined,
        agentSuggestion,
        replies,
      });
    }
    
    return enrichedTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTicket(id: string): Promise<TicketWithDetails | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const createdByUser = await this.getUser(ticket.createdBy);
    const assigneeUser = ticket.assignee ? await this.getUser(ticket.assignee) : undefined;
    const agentSuggestion = ticket.agentSuggestionId ? 
      Array.from(this.agentSuggestions.values()).find(s => s.id === ticket.agentSuggestionId) : undefined;
    const replies = await this.getTicketReplies(ticket.id);

    return {
      ...ticket,
      createdByUser: createdByUser ? {
        id: createdByUser.id,
        name: createdByUser.name,
        email: createdByUser.email,
      } : { id: ticket.createdBy, name: "Unknown", email: "unknown@email.com" },
      assigneeUser: assigneeUser ? {
        id: assigneeUser.id,
        name: assigneeUser.name,
        email: assigneeUser.email,
      } : undefined,
      agentSuggestion,
      replies,
    };
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = randomUUID();
    const now = new Date();
    const ticket: Ticket = {
      ...insertTicket,
      id,
      status: "open",
      category: insertTicket.category || "other",
      attachmentUrls: insertTicket.attachmentUrls || [],
      assignee: null,
      agentSuggestionId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updatedTicket: Ticket = {
      ...ticket,
      ...updates,
      updatedAt: new Date(),
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async createAgentSuggestion(insertSuggestion: InsertAgentSuggestion): Promise<AgentSuggestion> {
    const id = randomUUID();
    const suggestion: AgentSuggestion = {
      ...insertSuggestion,
      id,
      articleIds: insertSuggestion.articleIds || [],
      autoClosed: insertSuggestion.autoClosed !== undefined ? insertSuggestion.autoClosed : false,
      createdAt: new Date(),
    };
    this.agentSuggestions.set(id, suggestion);
    return suggestion;
  }

  async getAgentSuggestion(ticketId: string): Promise<AgentSuggestion | undefined> {
    return Array.from(this.agentSuggestions.values()).find(s => s.ticketId === ticketId);
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      ...insertLog,
      id,
      meta: insertLog.meta || {},
      ticketId: insertLog.ticketId || null,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogs(ticketId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.ticketId === ticketId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getConfig(): Promise<Config> {
    return this.config;
  }

  async updateConfig(updates: Partial<InsertConfig>): Promise<Config> {
    this.config = { ...this.config, ...updates };
    return this.config;
  }

  async createTicketReply(insertReply: InsertTicketReply): Promise<TicketReply> {
    const id = randomUUID();
    const reply: TicketReply = {
      ...insertReply,
      id,
      authorId: insertReply.authorId || null,
      createdAt: new Date(),
    };
    this.ticketReplies.set(id, reply);
    return reply;
  }

  async getTicketReplies(ticketId: string): Promise<TicketReply[]> {
    return Array.from(this.ticketReplies.values())
      .filter(reply => reply.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const tickets = Array.from(this.tickets.values());
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === "open" || t.status === "triaged" || t.status === "waiting_human").length;
    const autoResolved = tickets.filter(t => t.status === "resolved" && t.agentSuggestionId).length;
    
    return {
      totalTickets,
      openTickets,
      autoResolved,
      avgResponseTime: "2.4h",
    };
  }

  async searchKB(query: string): Promise<Article[]> {
    return this.getArticles(query, "published");
  }
}

export const storage = new MemStorage();
