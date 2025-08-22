import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, real, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "agent", "user"]);
export const categoryEnum = pgEnum("category", ["billing", "tech", "shipping", "other"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "triaged", "waiting_human", "resolved", "closed"]);
export const articleStatusEnum = pgEnum("article_status", ["draft", "published"]);
export const actorEnum = pgEnum("actor", ["system", "agent", "user"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Articles (KB) table
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  status: articleStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull().default("other"),
  status: ticketStatusEnum("status").notNull().default("open"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  assignee: varchar("assignee").references(() => users.id),
  agentSuggestionId: varchar("agent_suggestion_id"),
  attachmentUrls: text("attachment_urls").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Agent suggestions table
export const agentSuggestions = pgTable("agent_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id),
  predictedCategory: categoryEnum("predicted_category").notNull(),
  articleIds: text("article_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  draftReply: text("draft_reply").notNull(),
  confidence: real("confidence").notNull(),
  autoClosed: boolean("auto_closed").notNull().default(false),
  modelInfo: json("model_info").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Audit log table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => tickets.id),
  traceId: varchar("trace_id").notNull(),
  actor: actorEnum("actor").notNull(),
  action: text("action").notNull(),
  meta: json("meta"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

// Config table
export const config = pgTable("config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  autoCloseEnabled: boolean("auto_close_enabled").notNull().default(true),
  confidenceThreshold: real("confidence_threshold").notNull().default(0.78),
  slaHours: real("sla_hours").notNull().default(24),
});

// Ticket replies table
export const ticketReplies = pgTable("ticket_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => tickets.id),
  authorId: varchar("author_id").references(() => users.id),
  authorType: text("author_type").notNull(), // "user", "agent", "system"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(6),
}).omit({ passwordHash: true });

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  assignee: true,
  agentSuggestionId: true,
});

export const insertAgentSuggestionSchema = createInsertSchema(agentSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertConfigSchema = createInsertSchema(config).omit({
  id: true,
});

export const insertTicketReplySchema = createInsertSchema(ticketReplies).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type AgentSuggestion = typeof agentSuggestions.$inferSelect;
export type InsertAgentSuggestion = z.infer<typeof insertAgentSuggestionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Config = typeof config.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;
export type TicketReply = typeof ticketReplies.$inferSelect;
export type InsertTicketReply = z.infer<typeof insertTicketReplySchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Extended types for API responses
export type TicketWithDetails = Ticket & {
  createdByUser: Pick<User, "id" | "name" | "email">;
  assigneeUser?: Pick<User, "id" | "name" | "email">;
  agentSuggestion?: AgentSuggestion;
  replies: (TicketReply & { author?: Pick<User, "id" | "name" | "email"> })[];
};

export type DashboardStats = {
  totalTickets: number;
  openTickets: number;
  autoResolved: number;
  avgResponseTime: string;
};
