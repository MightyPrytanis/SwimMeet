import { type User, type InsertUser, type Conversation, type InsertConversation, type Response, type InsertResponse, type Credentials } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredentials(userId: string, credentials: string): Promise<void>;
  
  // Conversation methods
  createConversation(userId: string, conversation: InsertConversation): Promise<Conversation>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined>;
  updateConversationWorkflow(conversationId: string, workflowState: any): Promise<void>;
  
  // Response methods
  createResponse(response: InsertResponse): Promise<Response>;
  getConversationResponses(conversationId: string): Promise<Response[]>;
  updateResponseContent(id: string, content: string, status: string): Promise<void>;
  updateResponse(id: string, data: Partial<Response>): Promise<Response>;
  updateResponseMetadata(id: string, metadata: Record<string, any>): Promise<Response>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private responses: Map<string, Response>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.responses = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      encryptedCredentials: {},
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCredentials(userId: string, credentials: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.encryptedCredentials = { encrypted: credentials };
      this.users.set(userId, user);
    }
  }

  async createConversation(userId: string, insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      userId,
      attachedFiles: insertConversation.attachedFiles || [],
      workflowState: insertConversation.workflowState || {},
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      const updated = { ...conversation, ...data };
      this.conversations.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async updateConversationWorkflow(conversationId: string, workflowState: any): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.workflowState = workflowState;
      this.conversations.set(conversationId, conversation);
    }
  }

  async createResponse(insertResponse: InsertResponse): Promise<Response> {
    const id = randomUUID();
    const response: Response = {
      ...insertResponse,
      id,
      status: insertResponse.status || "pending",
      metadata: insertResponse.metadata || {},
      createdAt: new Date(),
    };
    this.responses.set(id, response);
    return response;
  }

  async getConversationResponses(conversationId: string): Promise<Response[]> {
    return Array.from(this.responses.values())
      .filter(resp => resp.conversationId === conversationId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  async updateResponseContent(id: string, content: string, status: string): Promise<void> {
    const response = this.responses.get(id);
    if (response) {
      response.content = content;
      response.status = status;
      this.responses.set(id, response);
    }
  }

  async updateResponseMetadata(id: string, metadata: Record<string, any>): Promise<Response> {
    const response = this.responses.get(id);
    if (response) {
      response.metadata = { ...response.metadata, ...metadata };
      this.responses.set(id, response);
      return response;
    }
    throw new Error(`Response with id ${id} not found`);
  }

  async updateResponse(id: string, updates: Partial<Response>): Promise<Response> {
    const response = this.responses.get(id);
    if (response) {
      Object.assign(response, updates);
      this.responses.set(id, response);
      return response;
    }
    throw new Error(`Response with id ${id} not found`);
  }

  async getResponse(id: string): Promise<Response | undefined> {
    return this.responses.get(id);
  }

  async getProviderStats(): Promise<Record<string, any>> {
    const allResponses = Array.from(this.responses.values());
    const stats: Record<string, any> = {};

    // Group responses by AI provider
    const responsesByProvider = allResponses.reduce((acc, response) => {
      if (!acc[response.aiProvider]) {
        acc[response.aiProvider] = [];
      }
      acc[response.aiProvider].push(response);
      return acc;
    }, {} as Record<string, Response[]>);

    // Calculate stats for each provider
    Object.entries(responsesByProvider).forEach(([provider, responses]) => {
      const completeResponses = responses.filter(r => r.status === 'complete');
      const verifiedResponses = responses.filter(r => r.verificationStatus === 'complete');
      const awardCounts = { gold: 0, silver: 0, bronze: 0, finished: 0, quit: 0, titanic: 0 };
      
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      let totalAccuracyScore = 0;
      let accuracyCount = 0;

      completeResponses.forEach(response => {
        // Count awards
        if (response.award && awardCounts.hasOwnProperty(response.award)) {
          awardCounts[response.award as keyof typeof awardCounts]++;
        }
        
        // Calculate average response times
        if (response.responseTimeMs) {
          totalResponseTime += parseInt(response.responseTimeMs);
          responseTimeCount++;
        }

        // Calculate verification scores
        if (response.verificationResults && response.verificationResults.length > 0) {
          response.verificationResults.forEach(verification => {
            totalAccuracyScore += verification.accuracyScore;
            accuracyCount++;
          });
        }
      });

      stats[provider] = {
        totalResponses: responses.length,
        completeResponses: completeResponses.length,
        verifiedResponses: verifiedResponses.length,
        awards: awardCounts,
        avgResponseTimeMs: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : null,
        avgAccuracyScore: accuracyCount > 0 ? Math.round((totalAccuracyScore / accuracyCount) * 10) / 10 : null,
        successRate: responses.length > 0 ? Math.round((completeResponses.length / responses.length) * 100) : 0,
        verificationRate: completeResponses.length > 0 ? Math.round((verifiedResponses.length / completeResponses.length) * 100) : 0
      };
    });

    return stats;
  }
}

// Import database storage
import { DatabaseStorage } from './db-storage';

// Use database storage for persistence
export const storage = new DatabaseStorage();
