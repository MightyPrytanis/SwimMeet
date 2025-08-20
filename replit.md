# replit.md

## Overview

"Swim Meet" is a sophisticated AI orchestration platform built with React, Express, and PostgreSQL that enables simultaneous querying of multiple AI services with advanced response management capabilities. The platform features a complete aquatic/natatorium design theme with authentic varsity block letter typography and supports 8 AI providers: OpenAI, Anthropic, Google, Microsoft, Perplexity, DeepSeek, Grok, and Llama.

## Recent Changes (January 2025)

✅ **PERSISTENT DATA STORAGE**: IMPLEMENTED - Switched from in-memory storage to PostgreSQL database using Drizzle ORM. All conversations, AI responses, statistics, and user data now persist across server restarts. No more data loss!
✅ **USER AUTHENTICATION SYSTEM**: IMPLEMENTED - Complete portable auth system with:
  - User registration/login with bcrypt password hashing
  - JWT tokens for secure session management
  - No Replit dependencies - fully portable to any server
  - Protected API routes requiring authentication
  - Session-based and token-based auth options
✅ **MAXIMUM PLATFORM INDEPENDENCE**: All authentication, storage, and core functionality uses standard technologies (PostgreSQL, JWT, bcrypt) with zero Replit dependencies. Project can be moved to any server.
✅ **Real-time Connection Status**: FULLY IMPLEMENTED - System performs actual API calls to test provider connections with genuine green/yellow/red status indicators
✅ **TURN Mode Verification**: FULLY IMPLEMENTED - Complete AI-to-AI fact-checking system with accuracy scores and detailed analysis
✓ **WORK Mode Collaboration**: Sequential AI collaboration system where agents build on each other's work
✓ **File Attachment Infrastructure**: Backend support for file uploads ready (UI temporarily disabled due to compilation issues)
✓ **Comprehensive Stats System**: Persistent performance tracking across all AI providers with award counts and response times
✅ **DATABASE SCHEMA**: Complete schema with users, conversations, responses tables supporting all features including file attachments and workflow states

## User Preferences

Preferred communication style: Simple, everyday language.
**CRITICAL REQUIREMENT**: 100% truth-based functionality - never simulate, fake, or claim capabilities that don't exist. User demands complete honesty about what works vs what's broken.
**COST OPTIMIZATION**: Minimize API calls during testing - reduce polling frequency and only test connections when necessary to avoid unnecessary charges.
**PROVIDER FOCUS**: Microsoft Copilot and Llama testing disabled due to external API issues - focusing on working providers (OpenAI, Claude, Gemini, Perplexity).
**COMMUNICATION PREFERENCE**: User values steady, measurable progress over hype or promotional language. Focus on factual status updates and concrete functionality verification.
**PLATFORM INDEPENDENCE PRIORITY**: User strongly prefers maximum portability with zero Replit dependencies. All solutions should be deployable on any server without proprietary tie-ins.
**DATA PERSISTENCE REQUIREMENT**: User needs to access EEOC work and other conversations days/weeks/months later. All data must persist in database, not memory.
**SECURITY PRIORITY**: User emphasizes proper authentication and security for production deployment on Cosmos/LexFiat platforms. Prefers simple, stable solutions over complex implementations.

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