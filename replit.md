# replit.md

## Overview

"Swim Meet" is a sophisticated AI orchestration platform built with React, Express, and PostgreSQL that enables simultaneous querying of multiple AI services with advanced response management capabilities. The platform features a complete aquatic/natatorium design theme with authentic varsity block letter typography and supports 8 AI providers: OpenAI, Anthropic, Google, Microsoft, Perplexity, DeepSeek, Grok, and Llama.

## Recent Changes (January 2025)

✅ **Real-time Connection Status**: FULLY IMPLEMENTED - System now performs actual API calls to test provider connections with genuine green/yellow/red status indicators. Console logs confirm real testing: OpenAI/Claude/Gemini/Perplexity show "CONNECTED", Microsoft/Llama show "ERROR" (403), DeepSeek/Grok show "SETUP_REQUIRED"
✅ **TURN Mode Verification**: FULLY IMPLEMENTED with DIVE-TURN Bridge - Complete AI-to-AI fact-checking system where selected AI agents verify and critique other agents' responses with detailed accuracy assessments. Users can now select any DIVE response for TURN analysis and share critiques back with original AI providers.
✓ **Relay Collaboration**: Full collaborative AI system allowing multiple agents to build on each other's responses, refine solutions, and synthesize final answers through iterative improvement
✓ **Varsity Typography**: Enhanced block letter styling using Google Fonts for authentic collegiate/varsity appearance throughout the interface
✓ **Functional Response Actions**: Complete implementations of fact-check, humanize, and reply features with modal dialogs and real AI processing
✓ **Deep Blue Aquatic Theme**: Maintained sophisticated underwater/natatorium design aesthetic with swimming event terminology and icons
✅ **RESOLVED**: React functionality confirmed working after project restart
✅ **Button Test**: Passed completely - all interactive elements function properly
✅ **Backend Infrastructure**: Multi-AI query system operational with real API testing
✅ **Comprehensive Stats System**: FULLY IMPLEMENTED - Persistent stats display next to AI model names showing award counts (🏆 XG XS XB) and average response times (⏱️ X.Xs). Complete stats dashboard accessible via toggle button showing detailed award breakdowns, success rates, and performance metrics for each AI provider.
✅ **Award Feedback System**: Visual confirmation system shows "⏳ Saving..." → "✓ Saved" for each award assignment with comprehensive award summary panel
🚨 **DATA INTEGRITY ISSUE**: Removing fake/simulated status indicators, implementing genuine API connection testing

## User Preferences

Preferred communication style: Simple, everyday language.
**CRITICAL REQUIREMENT**: 100% truth-based functionality - never simulate, fake, or claim capabilities that don't exist. User demands complete honesty about what works vs what's broken.
**COST OPTIMIZATION**: Minimize API calls during testing - reduce polling frequency and only test connections when necessary to avoid unnecessary charges.
**PROVIDER FOCUS**: Microsoft Copilot and Llama testing disabled due to external API issues - focusing on working providers (OpenAI, Claude, Gemini, Perplexity).

## System Architecture

### Frontend Architecture
The client-side is built with React and TypeScript, using Vite as the build tool. The UI is constructed with shadcn/ui components built on top of Radix UI primitives and styled with Tailwind CSS. The application uses React Query for server state management and Wouter for client-side routing. Key frontend features include:

- **Component-based UI**: Modular React components for AI selection, query input, response display, and conversation history
- **Real-time updates**: Polling mechanism to fetch live AI response updates as they're generated
- **Responsive design**: Mobile-first approach with Tailwind CSS for consistent styling across devices

### Backend Architecture
The server is an Express.js application that handles API requests, manages AI service integrations, and coordinates data persistence. Core backend responsibilities include:

- **AI Service Orchestration**: Centralized AIService class that manages connections to multiple AI providers
- **Credential Management**: Encrypted storage and secure handling of user API keys for different AI services
- **Query Processing**: Simultaneous submission of user queries to selected AI providers with response tracking
- **Session Management**: In-memory storage implementation with interface for future database integration

### Database Schema
The application uses Drizzle ORM with PostgreSQL for data persistence, featuring three main entities:

- **Users**: Store user accounts with encrypted credentials for AI services
- **Conversations**: Track user query sessions with metadata
- **Responses**: Store AI provider responses with status tracking and metadata

### Authentication and Security
- **Credential Encryption**: User API keys are encrypted using Node.js crypto module before storage
- **Environment-based Configuration**: Sensitive configuration managed through environment variables
- **Input Validation**: Zod schemas for request validation and type safety

### AI Provider Integration
The system supports 8 AI providers through a unified interface with real-time connection testing:

- **OpenAI**: Integration with GPT-4o model via official SDK
- **Anthropic**: Claude-4-Sonnet integration using Anthropic's SDK  
- **Google**: Gemini-2.5 model support through Google GenAI SDK
- **Microsoft Copilot**: Integration via RapidAPI proxy service
- **Perplexity**: Web-connected AI through Perplexity API
- **Grok (xAI)**: Integration with Grok-2 models via xAI API
- **DeepSeek**: Placeholder for future integration
- **Llama**: Meta Llama integration via RapidAPI proxy
- **Real-time Status Testing**: Live connection verification with visual indicator lights
- **Provider Abstraction**: Common interface for consistent error handling and response management

### Advanced AI Features
- **TURN Mode Verification**: AI-to-AI fact-checking where agents review and critique each other's responses
- **Relay Collaboration**: Multi-stage collaborative problem-solving with response refinement and synthesis
- **Response Enhancement**: Fact-checking via web search, humanization of AI language, and intelligent reply generation
- **Comprehensive Statistics**: Real-time tracking of AI provider performance including award counts, response times, success rates, and detailed analytics dashboard

## External Dependencies

### Database
- **PostgreSQL**: Primary database using Neon Database serverless Postgres
- **Drizzle ORM**: Type-safe database queries and schema management
- **Connection Pooling**: Managed through @neondatabase/serverless driver

### AI Services
- **OpenAI API**: GPT-4o model integration via @openai/api
- **Anthropic API**: Claude model access through @anthropic-ai/sdk
- **Google Gemini**: Integration via @google/genai package

### UI Framework
- **shadcn/ui**: Complete component library built on Radix UI
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework for responsive styling
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast build tool with TypeScript support and HMR
- **ESBuild**: Production bundling for server-side code
- **TypeScript**: Type safety across frontend and backend
- **React Query**: Server state management with caching and synchronization

### Authentication & Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Express Session**: Server-side session management

### Utilities
- **date-fns**: Date manipulation and formatting
- **zod**: Runtime type validation and schema definition
- **clsx/twMerge**: Conditional CSS class management