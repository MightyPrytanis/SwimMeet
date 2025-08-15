# replit.md

## Overview

This is a full-stack AI comparison application built with React, Express, and PostgreSQL that allows users to query multiple AI providers simultaneously and compare their responses. The app supports OpenAI, Anthropic, and Google's Gemini models, providing a unified interface to interact with different AI services and analyze their outputs side-by-side.

## User Preferences

Preferred communication style: Simple, everyday language.

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
The system supports multiple AI providers through a unified interface:

- **OpenAI**: Integration with GPT-4o model via official SDK
- **Anthropic**: Claude integration using Anthropic's SDK
- **Google**: Gemini model support through Google GenAI SDK
- **Provider Abstraction**: Common interface for adding new AI services with consistent error handling

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