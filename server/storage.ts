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
  
  // Response methods
  createResponse(response: InsertResponse): Promise<Response>;
  getConversationResponses(conversationId: string): Promise<Response[]>;
  updateResponseContent(id: string, content: string, status: string): Promise<void>;
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
}

export const storage = new MemStorage();
