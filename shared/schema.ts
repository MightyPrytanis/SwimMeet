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
  mode: text("mode").notNull().default("dive"), // dive, turn, work
  workflowState: json("workflow_state").$type<{
    currentStep: number;
    totalSteps: number;
    collaborativeDocument: string;
    stepHistory: {
      step: number;
      assignedAI: string;
      objective: string;
      completedAt?: string;
      output: string;
    }[];
    sharedContext: Record<string, any>;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const responses = pgTable("responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  aiProvider: text("ai_provider").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, complete, error
  award: text("award"), // gold, silver, bronze, finished, quit, titanic
  responseTimeMs: varchar("response_time_ms"), // time taken to generate response
  verificationStatus: text("verification_status").default("none"), // none, pending, complete, failed
  verificationResults: json("verification_results").$type<{
    verifiedBy: string;
    accuracyScore: number;
    factualErrors: string[];
    strengths: string[];
    weaknesses: string[];
    overallAssessment: string;
    recommendations: string[];
  }[]>().default([]),
  workStep: varchar("work_step"), // For WORK mode: which step this response belongs to
  handoffData: json("handoff_data").$type<{
    previousStep?: number;
    nextAI?: string;
    contextSummary?: string;
    taskSpecification?: string;
    buildingBlocks?: string[];
  }>().default({}),
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
  mode: true,
  workflowState: true,
});

export const insertResponseSchema = createInsertSchema(responses).pick({
  conversationId: true,
  aiProvider: true,
  content: true,
  status: true,
  workStep: true,
  handoffData: true,
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
  award?: 'gold' | 'silver' | 'bronze' | 'finished' | 'quit' | 'titanic';
  awardSaved?: boolean;
  verificationStatus?: 'none' | 'pending' | 'complete' | 'failed';
  verificationResults?: {
    verifiedBy: string;
    accuracyScore: number;
    factualErrors: string[];
    strengths: string[];
    weaknesses: string[];
    overallAssessment: string;
    recommendations: string[];
  }[];
  metadata?: {
    critiqueResponse?: {
      sharedAt: string;
      aiResponse: string;
    };
    [key: string]: any;
  };
}
