import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from "@google/genai";

/*
Follow these instructions when using this blueprint:
1. Note that the newest OpenAI model is "gpt-4o", not "gpt-4". gpt-4o was released after your knowledge cutoff. Always prefer using gpt-4o as it is the latest model.
2. The newest Anthropic model is "claude-sonnet-4-20250514", not older 3.x models.
3. Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
*/

export interface AIServiceResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenAI | null = null;

  constructor(credentials: Record<string, string>) {
    this.initializeClients(credentials);
  }

  private initializeClients(credentials: Record<string, string>) {
    // Use stored credentials or fallback to environment variables
    const openaiKey = credentials.openai || process.env.OPENAI_API_KEY;
    const anthropicKey = credentials.anthropic || process.env.ANTHROPIC_API_KEY;
    const geminiKey = credentials.google || process.env.GEMINI_API_KEY;

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }

    if (geminiKey) {
      this.gemini = new GoogleGenAI({ apiKey: geminiKey });
    }
  }

  async queryOpenAI(prompt: string): Promise<AIServiceResponse> {
    if (!this.openai) {
      return { success: false, error: "OpenAI API key not configured" };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // newest OpenAI model is "gpt-4o"
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      });

      return {
        success: true,
        content: response.choices[0].message.content || "No response generated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `OpenAI error: ${error.message}`,
      };
    }
  }

  async queryAnthropic(prompt: string): Promise<AIServiceResponse> {
    if (!this.anthropic) {
      return { success: false, error: "Anthropic API key not configured" };
    }

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514", // newest Anthropic model
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      return {
        success: true,
        content: response.content[0].type === 'text' ? response.content[0].text : "No text response",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Anthropic error: ${error.message}`,
      };
    }
  }

  async queryGemini(prompt: string): Promise<AIServiceResponse> {
    if (!this.gemini) {
      return { success: false, error: "Google AI API key not configured" };
    }

    try {
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash", // newest Gemini model
        contents: prompt,
      });

      return {
        success: true,
        content: response.text || "No response generated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Gemini error: ${error.message}`,
      };
    }
  }

  async queryMicrosoft(prompt: string): Promise<AIServiceResponse> {
    // Microsoft Copilot doesn't have a direct API - return a placeholder
    return { success: false, error: "Microsoft Copilot API not available" };
  }

  async queryPerplexity(prompt: string): Promise<AIServiceResponse> {
    // For now, return placeholder - Perplexity API would need separate implementation
    return { success: false, error: "Perplexity API not configured" };
  }

  async queryGrok(prompt: string): Promise<AIServiceResponse> {
    // Grok would use xAI API (similar to OpenAI)
    return { success: false, error: "Grok API not configured" };
  }

  async queryDeepSeek(prompt: string): Promise<AIServiceResponse> {
    return { success: false, error: "DeepSeek API not configured" };
  }

  async queryLlama(prompt: string): Promise<AIServiceResponse> {
    return { success: false, error: "Llama API not configured" };
  }

  async queryMultiple(prompt: string, providers: string[]): Promise<Record<string, AIServiceResponse>> {
    const results: Record<string, AIServiceResponse> = {};
    
    const promises = providers.map(async (provider) => {
      let result: AIServiceResponse;
      
      switch (provider) {
        case 'openai':
          result = await this.queryOpenAI(prompt);
          break;
        case 'anthropic':
          result = await this.queryAnthropic(prompt);
          break;
        case 'google':
          result = await this.queryGemini(prompt);
          break;
        case 'microsoft':
          result = await this.queryMicrosoft(prompt);
          break;
        case 'perplexity':
          result = await this.queryPerplexity(prompt);
          break;
        case 'grok':
          result = await this.queryGrok(prompt);
          break;
        case 'deepseek':
          result = await this.queryDeepSeek(prompt);
          break;
        case 'llama':
          result = await this.queryLlama(prompt);
          break;
        default:
          result = { success: false, error: `Unsupported provider: ${provider}` };
      }
      
      results[provider] = result;
    });

    await Promise.all(promises);
    return results;
  }

  async humanizeResponse(response: string): Promise<string> {
    // Remove AI-specific language and replace with human-like alternatives
    const humanizedNames = ['Linda', 'Marcus', 'Sarah', 'David', 'Emma', 'James', 'Maria', 'Alex'];
    const randomName = humanizedNames[Math.floor(Math.random() * humanizedNames.length)];
    
    let humanized = response
      .replace(/As an AI/gi, 'As someone')
      .replace(/I'm an AI/gi, `I'm ${randomName}`)
      .replace(/AI model/gi, 'person')
      .replace(/my training/gi, 'my experience')
      .replace(/I was trained/gi, 'I learned')
      .replace(/based on my training data/gi, 'from what I know')
      .replace(/I don't have real-time/gi, `I don't have the latest`)
      .replace(/ChatGPT|Claude|Gemini|GPT-4|AI assistant/gi, randomName);

    return humanized;
  }
}
