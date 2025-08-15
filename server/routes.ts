import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { encryptCredentials, decryptCredentials } from "./services/encryption";
import { AIService } from "./services/ai-service";
import { credentialsSchema, insertConversationSchema, insertResponseSchema, type QueryRequest, type AIProvider } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test connection endpoint
  app.post("/api/credentials/test", async (req, res) => {
    try {
      const { provider, apiKey } = req.body;
      
      const aiService = new AIService({ [provider]: apiKey });
      let testResult;

      switch (provider) {
        case 'openai':
          testResult = await aiService.queryOpenAI("Test message");
          break;
        case 'anthropic':
          testResult = await aiService.queryAnthropic("Test message");
          break;
        case 'google':
          testResult = await aiService.queryGemini("Test message");
          break;
        default:
          return res.status(400).json({ message: "Unsupported provider" });
      }

      res.json({ success: testResult.success, error: testResult.error });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Save credentials
  app.post("/api/credentials", async (req, res) => {
    try {
      const credentials = credentialsSchema.parse(req.body.credentials);
      const userId = req.body.userId || "default-user"; // For demo purposes
      
      const encryptedCredentials = encryptCredentials(credentials);
      await storage.updateUserCredentials(userId, encryptedCredentials);
      
      res.json({ message: "Credentials saved successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get available AI providers
  app.get("/api/providers", async (req, res) => {
    const userId = req.query.userId as string || "default-user";
    const user = await storage.getUser(userId);
    
    let credentials: Record<string, string> = {};
    if (user?.encryptedCredentials?.encrypted) {
      try {
        credentials = decryptCredentials(user.encryptedCredentials.encrypted);
      } catch (error) {
        // Handle decryption error gracefully
      }
    }

    const providers: AIProvider[] = [
      {
        id: 'openai',
        name: 'ChatGPT-4',
        company: 'OpenAI',
        requiresApiKey: true,
        status: credentials.openai ? 'connected' : 'setup_required'
      },
      {
        id: 'anthropic',
        name: 'Claude 3.5',
        company: 'Anthropic',
        requiresApiKey: true,
        status: credentials.anthropic ? 'connected' : 'setup_required'
      },
      {
        id: 'google',
        name: 'Gemini Pro',
        company: 'Google',
        requiresApiKey: true,
        status: credentials.google ? 'connected' : 'setup_required'
      },
      {
        id: 'microsoft',
        name: 'Copilot',
        company: 'Microsoft',
        requiresApiKey: false,
        status: 'setup_required'
      },
      {
        id: 'perplexity',
        name: 'Perplexity',
        company: 'Perplexity AI',
        requiresApiKey: true,
        status: 'setup_required'
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        company: 'DeepSeek AI',
        requiresApiKey: true,
        status: 'setup_required'
      },
      {
        id: 'grok',
        name: 'Grok',
        company: 'xAI',
        requiresApiKey: false,
        status: 'setup_required'
      },
      {
        id: 'llama',
        name: 'Llama 3.2',
        company: 'Meta',
        requiresApiKey: false,
        status: 'connected'
      }
    ];

    res.json(providers);
  });

  // Submit query to multiple AIs
  app.post("/api/query", async (req, res) => {
    try {
      const { query, selectedAIs, conversationId } = req.body as QueryRequest;
      const userId = req.body.userId || "default-user";
      
      // Create conversation if not provided
      let convId = conversationId;
      if (!convId) {
        const conversation = await storage.createConversation(userId, {
          title: query.substring(0, 50) + (query.length > 50 ? "..." : ""),
          query
        });
        convId = conversation.id;
      }

      // Get user credentials
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      // Create AI service instance
      const aiService = new AIService(credentials);

      // Create pending responses
      const responsePromises = selectedAIs.map(async (aiProvider) => {
        const response = await storage.createResponse({
          conversationId: convId!,
          aiProvider,
          content: "",
          status: "pending"
        });

        // Query AI in background
        setImmediate(async () => {
          const result = await aiService.queryMultiple(query, [aiProvider]);
          const aiResult = result[aiProvider];
          
          if (aiResult.success && aiResult.content) {
            await storage.updateResponseContent(response.id, aiResult.content, "complete");
          } else {
            await storage.updateResponseContent(response.id, aiResult.error || "Unknown error", "error");
          }
        });

        return response;
      });

      const responses = await Promise.all(responsePromises);
      
      res.json({
        conversationId: convId,
        responses: responses.map(r => ({
          id: r.id,
          aiProvider: r.aiProvider,
          content: r.content,
          status: r.status,
          timestamp: r.createdAt?.toISOString()
        }))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get conversation responses
  app.get("/api/conversations/:id/responses", async (req, res) => {
    try {
      const { id } = req.params;
      const responses = await storage.getConversationResponses(id);
      
      res.json(responses.map(r => ({
        id: r.id,
        aiProvider: r.aiProvider,
        content: r.content,
        status: r.status,
        timestamp: r.createdAt?.toISOString(),
        metadata: r.metadata
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default-user";
      const conversations = await storage.getUserConversations(userId);
      
      res.json(conversations.map(c => ({
        id: c.id,
        title: c.title,
        query: c.query,
        timestamp: c.createdAt?.toISOString()
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Humanize response
  app.post("/api/humanize", async (req, res) => {
    try {
      const { response } = req.body;
      const userId = req.body.userId || "default-user";
      
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      const aiService = new AIService(credentials);
      const humanized = await aiService.humanizeResponse(response);
      
      res.json({ humanizedResponse: humanized });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
