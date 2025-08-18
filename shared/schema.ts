import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  encryptedCredentials: json("encrypted_credentials").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  query: text("query").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  aiProvider: text("ai_provider").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, complete, error
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  query: true,
});

export const insertResponseSchema = createInsertSchema(responses).pick({
  conversationId: true,
  aiProvider: true,
  content: true,
  status: true,
  metadata: true,
});

export const credentialsSchema = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
  microsoft: z.string().optional(),
  perplexity: z.string().optional(),
  deepseek: z.string().optional(),
  grok: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responses.$inferSelect;
export type Credentials = z.infer<typeof credentialsSchema>;

export interface AIProvider {
  id: string;
  name: string;
  company: string;
  requiresApiKey: boolean;
  status: 'connected' | 'setup_required' | 'error' | 'disabled';
}

export interface QueryRequest {
  query: string;
  selectedAIs: string[];
  conversationId?: string;
}

export interface AIResponse {
  id: string;
  aiProvider: string;
  content: string;
  status: 'pending' | 'complete' | 'error';
  timestamp: string;
  metadata?: Record<string, any>;
}
