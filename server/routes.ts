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

  // Test AI provider connection
  app.post("/api/providers/test", async (req, res) => {
    try {
      const { providerId } = req.body;
      const userId = req.body.userId || "default-user";
      
      // Get user credentials
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          // Handle decryption error gracefully
        }
      }

      const aiService = new AIService(credentials);
      let testResult;

      switch (providerId) {
        case 'openai':
          testResult = await aiService.queryOpenAI("Test connection");
          break;
        case 'anthropic':
          testResult = await aiService.queryAnthropic("Test connection");
          break;
        case 'google':
          testResult = await aiService.queryGemini("Test connection");
          break;
        case 'microsoft':
          testResult = await aiService.queryMicrosoft("Test connection");
          break;
        case 'perplexity':
          testResult = await aiService.queryPerplexity("Test connection");
          break;
        case 'grok':
          testResult = await aiService.queryGrok("Test connection");
          break;
        case 'llama':
          testResult = await aiService.queryLlama("Test connection");
          break;
        case 'deepseek':
          testResult = await aiService.queryDeepSeek("Test connection");
          break;
        default:
          return res.status(400).json({ success: false, error: "Unknown provider" });
      }

      res.json({ success: testResult.success, error: testResult.error });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get available AI providers with REAL connection testing - NO CACHING
  app.get("/api/providers", async (req, res) => {
    // Force no caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
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

    console.log("TESTING AI PROVIDERS WITH REAL API CALLS...");
    const aiService = new AIService(credentials);
    
    const providerTests = [
      { id: 'openai', name: 'ChatGPT-4', company: 'OpenAI', requiresApiKey: true },
      { id: 'anthropic', name: 'Claude 4', company: 'Anthropic', requiresApiKey: true },
      { id: 'google', name: 'Gemini Pro', company: 'Google', requiresApiKey: true },
      { id: 'perplexity', name: 'Perplexity', company: 'Perplexity AI', requiresApiKey: true },
      { id: 'deepseek', name: 'DeepSeek', company: 'DeepSeek AI', requiresApiKey: true },
      { id: 'grok', name: 'Grok', company: 'xAI', requiresApiKey: true },
    ];



    // Test each provider with actual API calls - REAL TESTING
    const providers: AIProvider[] = await Promise.all(
      providerTests.map(async (provider) => {
        let testResult;
        
        try {
          console.log(`Testing ${provider.name}...`);
          switch (provider.id) {
            case 'openai':
              testResult = await aiService.queryOpenAI("Test connection");
              break;
            case 'anthropic':
              testResult = await aiService.queryAnthropic("Test connection");
              break;
            case 'google':
              testResult = await aiService.queryGemini("Test connection");
              break;

            case 'perplexity':
              testResult = await aiService.queryPerplexity("Test connection");
              break;
            case 'grok':
              testResult = await aiService.queryGrok("Test connection");
              break;

            case 'deepseek':
              testResult = await aiService.queryDeepSeek("Test connection");
              break;
            default:
              testResult = { success: false, error: "Unknown provider" };
          }
          console.log(`${provider.name}: ${testResult.success ? 'CONNECTED' : 'FAILED - ' + testResult.error}`);
        } catch (error: any) {
          testResult = { success: false, error: error.message };
          console.log(`${provider.name}: ERROR - ${error.message}`);
        }

        return {
          ...provider,
          status: (testResult.success ? 'connected' : 
                 (testResult.error?.includes('not configured') || testResult.error?.includes('API key')) ? 'setup_required' : 'error') as 'connected' | 'setup_required' | 'error'
        };
      })
    );

    console.log("REAL API TEST RESULTS:", providers.map(p => `${p.name}: ${p.status}`));
    
    // Add grayed-out disabled providers (API issues on their end)
    const disabledProviders = [
      { id: 'microsoft', name: 'Copilot', company: 'Microsoft', status: 'disabled' as const, requiresApiKey: false },
      { id: 'llama', name: 'Llama 3.2', company: 'Meta', status: 'disabled' as const, requiresApiKey: false },
    ];

    const allProviders = [...providers, ...disabledProviders];
    res.json(allProviders);
  });

  // Submit query to multiple AIs
  app.post("/api/query", async (req, res) => {
    try {
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      const { prompt, providers, query, selectedAIs, conversationId } = req.body as QueryRequest & { prompt?: string, providers?: string[] };
      const userId = req.body.userId || "default-user";
      
      // Support both old and new request formats
      const actualQuery = prompt || query;
      const actualProviders = providers || selectedAIs;
      
      console.log("Parsed values:", { actualQuery, actualProviders });
      
      if (!actualQuery) {
        return res.status(400).json({ message: "Query or prompt is required" });
      }
      
      if (!actualProviders || !Array.isArray(actualProviders) || actualProviders.length === 0) {
        return res.status(400).json({ message: "Providers array is required" });
      }
      
      // Create conversation if not provided
      let convId = conversationId;
      if (!convId) {
        console.log("Creating conversation with query:", actualQuery);
        const conversation = await storage.createConversation(userId, {
          title: actualQuery.substring(0, 50) + (actualQuery.length > 50 ? "..." : ""),
          query: actualQuery
        });
        convId = conversation.id;
        console.log("Created conversation with ID:", convId);
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
      const responsePromises = actualProviders.map(async (aiProvider) => {
        const response = await storage.createResponse({
          conversationId: convId!,
          aiProvider,
          content: "",
          status: "pending"
        });

        // Query AI in background
        setImmediate(async () => {
          const result = await aiService.queryMultiple(actualQuery, [aiProvider]);
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

  // Fact-check response
  app.post("/api/fact-check", async (req, res) => {
    try {
      const { response, query } = req.body;
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
      
      // Use Perplexity for fact-checking as it has web search capabilities
      const factCheckPrompt = `Please fact-check the following response to the query "${query}":

Response to check: "${response}"

Provide a detailed fact-check including:
1. Overall accuracy assessment
2. Any factual errors or inaccuracies
3. Missing important information
4. Sources or evidence to support or refute claims
5. Confidence level in your assessment

Be thorough and objective in your analysis.`;

      const factCheckResult = await aiService.queryPerplexity(factCheckPrompt);
      
      res.json({ factCheck: factCheckResult.content || factCheckResult.error });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate reply to response
  app.post("/api/reply", async (req, res) => {
    try {
      const { response, originalQuery, context } = req.body;
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
      
      const replyPrompt = `Based on this AI response to the query "${originalQuery}", generate a thoughtful follow-up question or comment that would help clarify, expand on, or challenge the response constructively.

Original query: "${originalQuery}"
AI Response: "${response}"
${context ? `Additional context: ${context}` : ''}

Generate a meaningful reply that:
1. Shows engagement with the content
2. Asks for clarification on unclear points
3. Requests additional details or examples
4. Challenges assumptions respectfully
5. Explores implications or applications

Provide only the reply text, no explanations.`;

      const replyResult = await aiService.queryAnthropic(replyPrompt);
      
      res.json({ reply: replyResult.content || replyResult.error });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Award response
  app.post("/api/responses/:id/award", async (req, res) => {
    const { id } = req.params;
    const { award } = req.body;
    
    const updatedResponse = await storage.updateResponse(id, { award });
    
    res.json({
      success: true,
      message: `Response awarded ${award}`,
      response: updatedResponse
    });
  });

  // Get AI provider statistics
  app.get("/api/stats", async (req, res) => {
    const stats = await storage.getProviderStats();
    res.json(stats);
  });

  // TURN Mode verification - AI-to-AI fact-checking
  app.post("/api/responses/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const { verifierAI } = req.body;
      const userId = req.body.userId || "default-user";
      
      const response = await storage.getResponse(id);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      const conversation = await storage.getConversation(response.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      // Update verification status to pending
      await storage.updateResponse(id, { verificationStatus: "pending" });

      const aiService = new AIService(credentials);
      
      const verificationPrompt = `TURN MODE VERIFICATION TASK
      
You are performing AI-to-AI verification. Carefully analyze this response for accuracy, completeness, and quality.

ORIGINAL QUERY: "${conversation.query}"

RESPONSE TO VERIFY (from ${response.aiProvider}):
"${response.content}"

VERIFICATION CRITERIA:
1. Factual Accuracy - Are all stated facts correct?
2. Completeness - Does it adequately address the query?
3. Clarity - Is it clear and well-structured?
4. Bias Detection - Any obvious bias or unsupported claims?
5. Source Quality - Are implicit sources reliable?

Respond in JSON format with:
{
  "accuracyScore": [1-10 rating],
  "factualErrors": ["list of any factual errors found"],
  "strengths": ["key strengths of the response"],
  "weaknesses": ["areas for improvement"],
  "overallAssessment": "detailed overall evaluation",
  "recommendations": ["specific suggestions for improvement"]
}`;

      let verificationResult;
      
      // Route to appropriate AI service based on verifier
      if (verifierAI === 'openai') {
        verificationResult = await aiService.queryOpenAI(verificationPrompt);
      } else if (verifierAI === 'anthropic') {
        verificationResult = await aiService.queryAnthropic(verificationPrompt);
      } else if (verifierAI === 'google') {
        verificationResult = await aiService.queryGemini(verificationPrompt);
      } else if (verifierAI === 'perplexity') {
        verificationResult = await aiService.queryPerplexity(verificationPrompt);
      } else {
        return res.status(400).json({ message: "Unsupported verifier AI" });
      }

      if (verificationResult.error) {
        await storage.updateResponse(id, { verificationStatus: "failed" });
        return res.status(500).json({ message: verificationResult.error });
      }

      // Parse verification results
      let parsedResults;
      try {
        parsedResults = JSON.parse(verificationResult.content || '{}');
      } catch (error) {
        // Fallback: create structured results from unstructured content
        parsedResults = {
          accuracyScore: 5,
          factualErrors: [],
          strengths: ["Analysis provided"],
          weaknesses: ["Could not parse detailed verification"],
          overallAssessment: verificationResult.content,
          recommendations: []
        };
      }

      // Add verifier info and update response
      const verificationData = {
        ...parsedResults,
        verifiedBy: verifierAI,
        verifiedAt: new Date().toISOString()
      };

      // Store verification data in metadata
      const currentMetadata = response.metadata || {};
      const currentResults = currentMetadata.verificationResults || [];
      const updatedResults = [...currentResults, verificationData];

      await storage.updateResponse(id, { 
        metadata: {
          ...currentMetadata,
          verificationStatus: "complete",
          verificationResults: updatedResults
        }
      });

      res.json({
        success: true,
        verification: verificationData,
        message: `Response verified by ${verifierAI}`
      });

    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Share TURN analysis with original AI
  app.post("/api/responses/:id/share-critique", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body.userId || "default-user";
      
      const response = await storage.getResponse(id);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      const verificationResults = response.metadata?.verificationResults;
      if (!verificationResults || verificationResults.length === 0) {
        return res.status(400).json({ message: "No verification results to share" });
      }

      const conversation = await storage.getConversation(response.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

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
      const latestVerification = verificationResults[verificationResults.length - 1];
      
      const sharePrompt = `TURN MODE CRITIQUE SHARING

Your colleague AI (${latestVerification.verifiedBy}) has analyzed your previous response and provided feedback. Please review this critique professionally and provide your thoughts on the assessment.

ORIGINAL QUERY: "${conversation.query}"

YOUR ORIGINAL RESPONSE:
"${response.content}"

COLLEAGUE'S CRITIQUE:
- Accuracy Score: ${latestVerification.accuracyScore}/10
- Factual Errors Found: ${latestVerification.factualErrors.join('; ') || 'None identified'}
- Strengths: ${latestVerification.strengths.join('; ')}
- Weaknesses: ${latestVerification.weaknesses.join('; ')}
- Overall Assessment: ${latestVerification.overallAssessment}
- Recommendations: ${latestVerification.recommendations.join('; ')}

Please respond with:
1. Your thoughts on the critique's accuracy
2. Any corrections or clarifications you'd like to make
3. How you might improve future responses based on this feedback

Keep your response professional and constructive.`;

      let shareResult;
      
      // Route to the original AI provider
      if (response.aiProvider === 'openai') {
        shareResult = await aiService.queryOpenAI(sharePrompt);
      } else if (response.aiProvider === 'anthropic') {
        shareResult = await aiService.queryAnthropic(sharePrompt);
      } else if (response.aiProvider === 'google') {
        shareResult = await aiService.queryGemini(sharePrompt);
      } else if (response.aiProvider === 'perplexity') {
        shareResult = await aiService.queryPerplexity(sharePrompt);
      } else {
        return res.status(400).json({ message: "Unsupported AI provider for sharing" });
      }

      if (shareResult.error) {
        return res.status(500).json({ message: shareResult.error });
      }

      // Store the AI's response to the critique
      const updatedMetadata = {
        ...response.metadata,
        critiqueResponse: {
          sharedAt: new Date().toISOString(),
          aiResponse: shareResult.content
        }
      };

      await storage.updateResponse(id, { metadata: updatedMetadata });

      res.json({
        success: true,
        aiResponse: shareResult.content,
        message: `Critique shared with ${response.aiProvider}`
      });

    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Award response
  app.post("/api/responses/:id/award", async (req, res) => {
    try {
      const { id } = req.params;
      const { award } = req.body;
      
      // Update response metadata with award
      const response = await storage.updateResponseMetadata(id, { award });
      
      res.json({ 
        success: true, 
        message: `Response awarded ${award}`,
        response: {
          id: response.id,
          aiProvider: response.aiProvider,
          award: response.metadata?.award
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
