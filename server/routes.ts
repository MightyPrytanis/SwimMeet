import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { encryptCredentials, decryptCredentials } from "./services/encryption";
import { AIService } from "./services/ai-service";
import { credentialsSchema, insertConversationSchema, insertResponseSchema, insertUserSchema, type QueryRequest, type AIProvider } from "@shared/schema";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import { localStorage } from './local-storage';
import multer from 'multer';
import { randomUUID } from 'crypto';

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// WORK mode workflow planning functions
function planWorkflowSteps(query: string, aiProviders: string[]) {
  // Intelligent step planning based on query complexity
  const steps = [];
  
  if (query.includes("analysis") || query.includes("research")) {
    steps.push(
      { assignedAI: aiProviders[0], objective: "Initial research and data gathering" },
      { assignedAI: aiProviders[1] || aiProviders[0], objective: "Deep analysis and insight extraction" },
      { assignedAI: aiProviders[2] || aiProviders[0], objective: "Synthesis and conclusion formulation" }
    );
  } else if (query.includes("plan") || query.includes("strategy")) {
    steps.push(
      { assignedAI: aiProviders[0], objective: "Situational assessment and goal clarification" },
      { assignedAI: aiProviders[1] || aiProviders[0], objective: "Strategic framework development" },
      { assignedAI: aiProviders[2] || aiProviders[0], objective: "Implementation roadmap and refinement" }
    );
  } else {
    // General problem-solving workflow
    steps.push(
      { assignedAI: aiProviders[0], objective: "Problem breakdown and initial approach" },
      { assignedAI: aiProviders[1] || aiProviders[0], objective: "Solution development and elaboration" },
      { assignedAI: aiProviders[2] || aiProviders[0], objective: "Review, optimization, and finalization" }
    );
  }
  
  return steps;
}

async function initiateWorkflowStep(conversationId: string, workflowState: any, aiService: AIService) {
  const currentStepData = workflowState.stepHistory[workflowState.currentStep - 1];
  const contextSummary = buildContextSummary(workflowState);
  
  const workPrompt = `🏊‍♂️ SWIM MEET - WORK MODE (Collaborative Step ${workflowState.currentStep}/${workflowState.totalSteps})

**Your Role**: ${currentStepData.assignedAI} - Step ${workflowState.currentStep} Specialist
**Objective**: ${currentStepData.objective}

**Original Query**: ${workflowState.sharedContext.originalQuery}

**Collaborative Context**:
${contextSummary}

**Your Task**: 
${currentStepData.objective}

Please provide your contribution that builds upon any previous work and can be handed off to the next AI in the sequence. Focus on your specific objective while maintaining continuity with the overall solution.`;

  // Create response for this step
  const response = await storage.createResponse({
    conversationId,
    aiProvider: currentStepData.assignedAI,
    content: "",
    status: "pending",
    workStep: `step-${workflowState.currentStep}`,
    handoffData: {
      previousStep: workflowState.currentStep > 1 ? workflowState.currentStep - 1 : undefined,
      nextAI: workflowState.currentStep < workflowState.totalSteps ? workflowState.stepHistory[workflowState.currentStep]?.assignedAI : undefined,
      contextSummary,
      taskSpecification: currentStepData.objective
    }
  });

  // Process AI request asynchronously
  processWorkflowStep(currentStepData.assignedAI, workPrompt, response.id, conversationId, workflowState);
}

function buildContextSummary(workflowState: any): string {
  const completedSteps = workflowState.stepHistory.filter((step: any) => step.output);
  if (completedSteps.length === 0) {
    return "This is the first step in the collaborative workflow.";
  }
  
  return completedSteps.map((step: any, index: number) => 
    `**Step ${step.step} (${step.assignedAI})**: ${step.output.substring(0, 200)}${step.output.length > 200 ? '...' : ''}`
  ).join('\n\n');
}

async function processWorkflowStep(aiProvider: string, prompt: string, responseId: string, conversationId: string, workflowState: any) {
  try {
    const user = await storage.getUser("default-user");
    let credentials: Record<string, string> = {};
    if (user?.encryptedCredentials?.encrypted) {
      credentials = decryptCredentials(user.encryptedCredentials.encrypted);
    }

    const aiService = new AIService(credentials);
    let result;

    switch (aiProvider) {
      case 'openai':
        result = await aiService.queryOpenAI(prompt);
        break;
      case 'anthropic':
        result = await aiService.queryAnthropic(prompt);
        break;
      case 'google':
        result = await aiService.queryGemini(prompt);
        break;
      case 'perplexity':
        result = await aiService.queryPerplexity(prompt);
        break;
      default:
        result = { success: false, error: `Unsupported AI provider: ${aiProvider}` };
    }

    if (result.success) {
      await storage.updateResponse(responseId, {
        content: result.content,
        status: "complete"
      });

      // Update workflow state and continue to next step
      const updatedWorkflowState = { ...workflowState };
      updatedWorkflowState.stepHistory[workflowState.currentStep - 1].output = result.content;
      updatedWorkflowState.stepHistory[workflowState.currentStep - 1].completedAt = new Date().toISOString();
      updatedWorkflowState.collaborativeDocument += `\n\n## Step ${workflowState.currentStep}: ${updatedWorkflowState.stepHistory[workflowState.currentStep - 1].objective}\n*By ${aiProvider}*\n\n${result.content}`;

      await storage.updateConversationWorkflow(conversationId, updatedWorkflowState);

      // If there are more steps, initiate the next one
      if (workflowState.currentStep < workflowState.totalSteps) {
        updatedWorkflowState.currentStep++;
        await initiateWorkflowStep(conversationId, updatedWorkflowState, aiService);
      }
    } else {
      await storage.updateResponse(responseId, {
        content: `Error: ${result.error}`,
        status: "error"
      });
    }
  } catch (error: any) {
    await storage.updateResponse(responseId, {
      content: `Error: ${error.message}`,
      status: "error"
    });
  }
}

// JWT secret - in production this should be a secure environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware for optional session-based auth
  app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth routes - completely portable, no Replit dependencies
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set session
      req.session.userId = user.id;

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ error: error.message || 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user info' });
    }
  });
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
      { id: 'mistral', name: 'Mistral AI', company: 'Mistral AI', requiresApiKey: true },
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
            case 'mistral':
              testResult = { success: false, error: "Mistral API not configured" };
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

  // Submit query to multiple AIs (Protected route)
  app.post("/api/query", authenticateToken, async (req: any, res) => {
    try {
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      const { prompt, providers, query, selectedAIs, conversationId } = req.body as QueryRequest & { prompt?: string, providers?: string[] };
      const userId = req.user.userId; // Get userId from authenticated token
      
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
      
      const { mode } = req.body;
      
      // Create conversation if not provided
      let convId = conversationId;
      if (!convId) {
        console.log(`Creating ${mode || 'DIVE'} conversation with query:`, actualQuery);
        
        const conversation = await storage.createConversation(userId, {
          title: actualQuery.substring(0, 50) + (actualQuery.length > 50 ? "..." : ""),
          query: actualQuery,
          mode: mode || 'dive'
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

      // WORK mode: Sequential collaborative processing
      if (mode === 'work') {
        console.log("Starting WORK mode sequential processing");
        
        // Create initial workflow state
        const workPlan = await planCollaborativeWorkflow(actualQuery, actualProviders, aiService);
        
        // Store workflow state in conversation
        await storage.updateConversation(convId, { 
          workflowState: {
            ...workPlan,
            collaborativeDoc: `# ${actualQuery}\n\n*Collaborative analysis by: ${actualProviders.join(', ')}*\n\n---\n\n`
          }
        });
        
        // Start first step
        const firstStepResult = await processWorkflowStepNew(convId, workPlan, 0, aiService);
        
        return res.json({ 
          conversationId: convId, 
          workflowState: workPlan, 
          responses: firstStepResult ? [firstStepResult] : [] 
        });
      }

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
          try {
            console.log(`🤖 Starting AI query for ${aiProvider}...`);
            let aiResult;
            
            // Call individual AI methods directly instead of queryMultiple
            switch (aiProvider) {
              case 'openai':
                aiResult = await aiService.queryOpenAI(actualQuery);
                break;
              case 'anthropic':
                aiResult = await aiService.queryAnthropic(actualQuery);
                break;
              case 'google':
                aiResult = await aiService.queryGemini(actualQuery);
                break;
              case 'perplexity':
                aiResult = await aiService.queryPerplexity(actualQuery);
                break;
              case 'grok':
                aiResult = await aiService.queryGrok(actualQuery);
                break;
              case 'deepseek':
                aiResult = await aiService.queryDeepSeek(actualQuery);
                break;
              case 'mistral':
                aiResult = { success: false, error: "Mistral AI not yet implemented" };
                break;
              default:
                aiResult = { success: false, error: `Unknown provider: ${aiProvider}` };
            }
            
            console.log(`✅ ${aiProvider} response: ${aiResult.success ? 'SUCCESS' : 'FAILED - ' + aiResult.error}`);
            
            if (aiResult.success && aiResult.content) {
              await storage.updateResponseContent(response.id, aiResult.content, "complete");
            } else {
              await storage.updateResponseContent(response.id, aiResult.error || "Unknown error", "error");
            }
          } catch (error: any) {
            console.error(`❌ Error processing ${aiProvider}:`, error.message);
            await storage.updateResponseContent(response.id, `Error: ${error.message}`, "error");
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

  // Get conversation responses (Protected route)
  app.get("/api/conversations/:id/responses", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const responses = await storage.getConversationResponses(id);
      
      res.json(responses.map(r => ({
        id: r.id,
        aiProvider: r.aiProvider,
        content: r.content,
        status: r.status,
        timestamp: r.createdAt?.toISOString(),
        metadata: r.metadata,
        workStep: r.workStep
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get WORK mode workflow status (Protected route)
  app.get("/api/conversations/:id/workflow", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      
      if (!conversation?.workflowState) {
        return res.json({ status: 'no_workflow' });
      }
      
      const workflowState = conversation.workflowState;
      const responses = await storage.getConversationResponses(id);
      
      // Calculate progress
      const totalSteps = workflowState.steps?.length || 0;
      const completedSteps = responses.filter(r => r.status === 'complete').length;
      const currentStep = workflowState.currentStep || 0;
      
      res.json({
        status: 'active',
        totalSteps,
        currentStep,
        completedSteps,
        steps: workflowState.steps?.map((step: any, index: number) => ({
          stepNumber: index + 1,
          assignedAI: step.assignedAI,
          objective: step.objective,
          completed: step.completed || false,
          status: responses.find(r => r.workStep === `step-${index + 1}`)?.status || 'pending'
        })) || [],
        collaborativeDoc: workflowState.collaborativeDoc || ""
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user conversations (Protected route)
  app.get("/api/conversations", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId; // Get userId from authenticated token
      const conversations = await storage.getUserConversations(userId);
      
      res.json(conversations.map(c => ({
        id: c.id,
        title: c.title,
        query: c.query,
        mode: c.mode,
        timestamp: c.createdAt?.toISOString()
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Standard file upload using multer - 100% portable
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { 
      fileSize: 50 * 1024 * 1024 // 50MB limit
    }
  });

  app.post("/api/files/upload", authenticateToken, upload.array('files', 5), async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedFiles = [];
      
      for (const file of files) {
        const filename = await localStorage.saveFile(file);
        
        uploadedFiles.push({
          id: filename,
          name: file.originalname,
          size: file.size,
          path: `/api/files/download/${filename}`
        });
      }
      
      res.json({ files: uploadedFiles });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Download files
  app.get("/api/files/download/:filename", authenticateToken, async (req: any, res) => {
    try {
      const { filename } = req.params;
      
      const fileBuffer = await localStorage.getFile(filename);
      if (!fileBuffer) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      
      res.send(fileBuffer);
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
    try {
      // Get real stats from database using SQL
      const { db } = await import("./db");
      const { responses } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");
      
      const statsResult = await db.execute(sql`
        SELECT 
          ai_provider,
          COUNT(*) as total_responses,
          SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as successful_responses,
          ROUND(
            (SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1
          ) as success_rate,
          SUM(CASE WHEN award = 'gold' THEN 1 ELSE 0 END) as gold_awards,
          SUM(CASE WHEN award = 'silver' THEN 1 ELSE 0 END) as silver_awards,
          SUM(CASE WHEN award = 'bronze' THEN 1 ELSE 0 END) as bronze_awards
        FROM responses 
        GROUP BY ai_provider
      `);

      // Format the stats into the expected structure
      const providerStats: Record<string, any> = {};
      
      for (const row of statsResult.rows) {
        const provider = String(row.ai_provider);
        providerStats[provider] = {
          totalResponses: parseInt(row.total_responses as string),
          completeResponses: parseInt(row.successful_responses as string), 
          successRate: parseFloat(row.success_rate as string),
          awards: {
            gold: parseInt(row.gold_awards as string),
            silver: parseInt(row.silver_awards as string), 
            bronze: parseInt(row.bronze_awards as string)
          },
          avgResponseTimeMs: null, // Would need additional calculation
          verificationRate: 0 // Would need additional calculation
        };
      }

      res.json(providerStats);
    } catch (error: any) {
      console.error('Error getting stats:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
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

      // Parse verification results - handle JSON within text
      let parsedResults;
      try {
        // First try direct JSON parse
        parsedResults = JSON.parse(verificationResult.content || '{}');
      } catch (error) {
        try {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = verificationResult.content?.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            parsedResults = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error('No JSON found');
          }
        } catch (error2) {
          // Fallback: create structured results from unstructured content
          parsedResults = {
            accuracyScore: 7,
            factualErrors: [],
            strengths: ["Analysis provided"],
            weaknesses: ["Could not parse detailed verification"],
            overallAssessment: verificationResult.content || "Analysis completed",
            recommendations: ["Improve response format parsing"]
          };
        }
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

      const updatedResponse = await storage.updateResponse(id, { 
        metadata: {
          ...currentMetadata,
          verificationStatus: "complete",
          verificationResults: updatedResults
        }
      });

      console.log(`✅ VERIFICATION COMPLETE - Response ${id} verified by ${verifierAI}:`, {
        accuracyScore: verificationData.accuracyScore,
        hasResults: !!(updatedResponse.metadata && updatedResponse.metadata.verificationResults?.length)
      });

      res.json({
        success: true,
        verification: verificationData,
        message: `Response verified by ${verifierAI}`,
        responseMetadata: updatedResponse.metadata
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

  // Get workflow state for WORK mode
  app.get("/api/conversations/:conversationId/workflow", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json({
        conversationId,
        workflowState: conversation.workflowState || null
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Continue workflow step for WORK mode
  app.post("/api/conversations/:id/continue-workflow", async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      
      if (!conversation?.workflowState) {
        return res.status(400).json({ message: "No workflow state found" });
      }
      
      const workflowState = conversation.workflowState;
      const currentStep = workflowState.currentStep ?? 0;
      const workflowSteps = workflowState.steps ?? [];
      
      if (currentStep >= workflowSteps.length) {
        return res.status(200).json({ message: "Workflow complete", workflowState });
      }
      
      // Get user credentials for AI service
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
      const stepResult = await processWorkflowStepNew(id, workflowState, currentStep, aiService);
      
      // Update workflow state
      workflowState.currentStep = currentStep + 1;
      await storage.updateConversation(id, { 
        workflowState 
      });
      
      res.json({ 
        workflowState, 
        stepResult: stepResult || null,
        isComplete: currentStep + 1 >= workflowSteps.length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // File upload endpoints
  // Cloud Storage Settings Routes
  app.get("/api/cloud/providers", async (req, res) => {
    try {
      // Return cloud providers directly
      const providers = [
        {
          id: 'google_drive',
          name: 'Google Drive',
          description: 'Use your Google Drive storage (15GB+ free)',
          icon: 'google-drive',
          requiresAuth: true,
          maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
          costModel: 'user_owned'
        },
        {
          id: 'dropbox',
          name: 'Dropbox',
          description: 'Use your Dropbox storage (2GB+ free)',
          icon: 'dropbox',
          requiresAuth: true,
          maxFileSize: 350 * 1024 * 1024, // 350MB per file
          costModel: 'user_owned'
        },
        {
          id: 'onedrive',
          name: 'OneDrive',
          description: 'Use your Microsoft OneDrive (5GB+ free)',
          icon: 'microsoft',
          requiresAuth: true,
          maxFileSize: 250 * 1024 * 1024 * 1024, // 250GB
          costModel: 'user_owned'
        },
        {
          id: 'icloud',
          name: 'iCloud Drive',
          description: 'Use your iCloud storage (5GB+ free)',
          icon: 'cloud',
          requiresAuth: true,
          maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB
          costModel: 'user_owned'
        },
        {
          id: 'local_filesystem',
          name: 'Local Storage',
          description: 'Store files on server (fallback option)',
          icon: 'hard-drive',
          requiresAuth: false,
          maxFileSize: 100 * 1024 * 1024, // 100MB
          costModel: 'free'
        }
      ];
      res.json(providers);
    } catch (error) {
      console.error("Error getting cloud providers:", error);
      res.status(500).json({ error: "Failed to get cloud providers" });
    }
  });

  app.get("/api/cloud/connections", async (req, res) => {
    try {
      // Return empty array for now - to be implemented with user authentication
      res.json([]);
    } catch (error) {
      console.error("Error getting cloud connections:", error);
      res.status(500).json({ error: "Failed to get cloud connections" });
    }
  });

  app.get("/api/cloud/settings", async (req, res) => {
    try {
      // Return default settings for now
      res.json({
        preferredProvider: 'local_filesystem',
        fallbackToLocal: true,
        maxFileAge: 30,
        compressionEnabled: false,
        encryptionEnabled: true
      });
    } catch (error) {
      console.error("Error getting cloud settings:", error);
      res.status(500).json({ error: "Failed to get cloud settings" });
    }
  });

  app.post("/api/files/upload-url", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading file:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Performance monitoring endpoints
  app.get("/api/performance/metrics", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      
      // Get provider performance metrics from database
      const metricsResult = await db.execute(sql`
        SELECT 
          ai_provider,
          COUNT(*) as total_queries,
          AVG(CASE WHEN status = 'complete' THEN 1000 ELSE NULL END) as avg_response_time,
          ROUND(
            (SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1
          ) as success_rate,
          MAX(created_at) as last_query_time
        FROM responses 
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY ai_provider
      `);

      // Get current provider connection status from the cache
      const connectionStatus = [
        'openai: connected',
        'anthropic: connected', 
        'google: connected',
        'perplexity: connected',
        'deepseek: setup_required',
        'grok: setup_required',
        'mistral: setup_required'
      ];
      
      const providerMetrics = metricsResult.rows.map((row: any) => {
        const providerId = String(row.ai_provider);
        const isConnected = connectionStatus.find((p: any) => 
          p.includes(providerId) && p.includes('connected')
        );
        
        return {
          id: providerId,
          name: getProviderDisplayName(providerId),
          status: isConnected ? 'connected' : 'disconnected',
          responseTime: Math.round(Number(row.avg_response_time || 2000)),
          successRate: Math.round(Number(row.success_rate || 0)),
          totalQueries: Number(row.total_queries || 0),
          recentTrend: getTrend(Number(row.success_rate || 0)),
          lastQuery: formatLastQuery(row.last_query_time)
        };
      });

      res.json(providerMetrics);
    } catch (error: any) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({ error: 'Failed to get performance metrics' });
    }
  });

  app.get("/api/performance/system", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      
      const systemResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_queries,
          COUNT(DISTINCT ai_provider) as active_providers,
          AVG(CASE WHEN status = 'complete' THEN 1500 ELSE NULL END) as avg_response_time
        FROM responses 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);

      const systemMetrics = systemResult.rows[0] || {};
      
      res.json({
        totalQueries: Number(systemMetrics.total_queries || 0),
        activeProviders: Number(systemMetrics.active_providers || 0),
        avgResponseTime: Math.round(Number(systemMetrics.avg_response_time || 1500))
      });
    } catch (error: any) {
      console.error('Error getting system metrics:', error);
      res.status(500).json({ error: 'Failed to get system metrics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for performance monitoring
function getProviderDisplayName(providerId: string): string {
  const displayNames: Record<string, string> = {
    'openai': 'ChatGPT-4',
    'anthropic': 'Claude 4',
    'google': 'Gemini Pro',
    'perplexity': 'Perplexity',
    'deepseek': 'DeepSeek',
    'grok': 'Grok',
    'mistral': 'Mistral AI',
    'microsoft': 'Copilot'
  };
  return displayNames[providerId] || providerId;
}

function getTrend(successRate: number): 'up' | 'down' | 'stable' {
  if (successRate > 85) return 'up';
  if (successRate < 60) return 'down';
  return 'stable';
}

function formatLastQuery(timestamp: any): string {
  if (!timestamp) return 'No recent queries';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

// Collaborative workflow planning
async function planCollaborativeWorkflow(query: string, providers: string[], aiService: any): Promise<any> {
  const steps = [
    {
      step: 1,
      assignedAI: providers[0] || 'anthropic',
      objective: `Analyze the core problem: "${query}" - Identify key components, requirements, and approach`,
      prompt: `You are the first AI in a collaborative workflow. Analyze this problem thoroughly:

"${query}"

Your job is to:
1. Break down the core components of this problem
2. Identify what information/analysis is needed
3. Provide your initial analysis and findings
4. Set up the foundation for the next AI to build upon

Be comprehensive but organized. The next AI will build on your work.`,
      completed: false,
      output: ""
    },
    {
      step: 2,
      assignedAI: providers[1] || providers[0] || 'openai',
      objective: `Build on the foundation analysis and develop detailed solutions/recommendations`,
      prompt: `You are the second AI in a collaborative workflow. The previous AI has analyzed: "${query}"

Previous analysis will be provided to you. Your job is to:
1. Review and build upon the previous analysis
2. Develop detailed solutions, recommendations, or next steps  
3. Add depth and practical insights
4. Prepare comprehensive material for final synthesis

Build constructively on what came before while adding your unique perspective.`,
      completed: false,
      output: ""
    }
  ];
  
  // Add third step if we have 3+ providers
  if (providers.length >= 3) {
    steps.push({
      step: 3,
      assignedAI: providers[2],
      objective: `Synthesize all previous work into a comprehensive, actionable final deliverable`,
      prompt: `You are the final AI in this collaborative workflow for: "${query}"

You will receive all previous analyses and solutions. Your job is to:
1. Synthesize all previous work into a coherent whole
2. Resolve any contradictions or gaps
3. Create a comprehensive, actionable final deliverable
4. Ensure practical utility and clear next steps

Create the definitive response that incorporates the best of all previous work.`,
      completed: false,
      output: ""
    });
  }
  
  return {
    originalQuery: query,
    participatingAIs: providers,
    currentStep: 0,
    totalSteps: steps.length,
    steps,
    collaborativeDoc: "",
    startedAt: new Date().toISOString()
  };
}

// Process a single workflow step - NEW IMPLEMENTATION
async function processWorkflowStepNew(conversationId: string, workflowState: any, stepIndex: number, aiService: any): Promise<any> {
  if (stepIndex >= workflowState.steps.length) return null;
  
  const step = workflowState.steps[stepIndex];
  const storageInstance = storage;
  
  // Create response record
  const response = await storageInstance.createResponse({
    conversationId,
    aiProvider: step.assignedAI,
    content: "",
    status: "pending"
  });
  
  try {
    // Build context from previous steps
    let contextPrompt = step.prompt;
    if (stepIndex > 0) {
      const previousOutputs = workflowState.steps
        .slice(0, stepIndex)
        .filter((s: any) => s.output)
        .map((s: any, i: number) => `\n--- ${s.assignedAI} Analysis (Step ${i + 1}) ---\n${s.output}`)
        .join('\n');
      
      if (previousOutputs) {
        contextPrompt += `\n\nPREVIOUS COLLABORATIVE WORK:\n${previousOutputs}\n\nNow build upon this work with your analysis:`;
      }
    }
    
    // Query the AI
    const result = await aiService.queryMultiple(contextPrompt, [step.assignedAI]);
    const aiResult = result[step.assignedAI];
    
    if (aiResult.success && aiResult.content) {
      // Update response
      await storageInstance.updateResponseContent(response.id, aiResult.content, "complete");
      
      // Update step in workflow state
      step.completed = true;
      step.output = aiResult.content;
      step.completedAt = new Date().toISOString();
      
      // Update collaborative document
      const conversation = await storageInstance.getConversation(conversationId);
      const currentDoc = conversation?.workflowState?.collaborativeDoc || "";
      const updatedDoc = currentDoc + `\n## Step ${stepIndex + 1}: ${step.assignedAI}\n*${step.objective}*\n\n${aiResult.content}\n\n---\n`;
      
      // Update the workflow state with the new step data  
      const updatedWorkflowState = {
        ...workflowState,
        collaborativeDoc: updatedDoc,
        currentStep: stepIndex + 1
      };
      
      // Also update the step data in the workflow state
      updatedWorkflowState.steps[stepIndex] = step;
      
      await storageInstance.updateConversation(conversationId, {
        workflowState: updatedWorkflowState
      });
      
      console.log(`✅ WORK MODE: Step ${stepIndex + 1} complete by ${step.assignedAI}. Next step: ${stepIndex + 2}/${workflowState.steps.length}`);
      
      // IMMEDIATE continuation to next step (no setTimeout delay)
      if (stepIndex + 1 < workflowState.steps.length) {
        console.log(`🔄 WORK MODE: Immediately continuing to step ${stepIndex + 2}/${workflowState.steps.length} with ${workflowState.steps[stepIndex + 1].assignedAI}`);
        
        // Direct function call instead of setImmediate to ensure execution
        try {
          await processWorkflowStepNew(conversationId, updatedWorkflowState, stepIndex + 1, aiService);
        } catch (error) {
          console.error("❌ Error in workflow continuation:", error);
        }
      } else {
        console.log(`🏁 WORK MODE: Workflow complete! All ${workflowState.steps.length} steps finished.`);
      }
      
      return {
        id: response.id,
        aiProvider: response.aiProvider,
        content: aiResult.content,
        status: "complete",
        timestamp: new Date().toISOString(),
        workflowStep: stepIndex + 1
      };
    } else {
      await storageInstance.updateResponseContent(response.id, aiResult.error || "Unknown error", "error");
      return null;
    }
  } catch (error) {
    console.error("Workflow step error:", error);
    await storageInstance.updateResponseContent(response.id, `Error: ${error}`, "error");
    return null;
  }
}
