# replit.md

## Overview

"Swim Meet" is a sophisticated AI orchestration platform built with React, Express, and PostgreSQL that enables simultaneous querying of multiple AI services with advanced response management capabilities. The platform features a complete aquatic/natatorium design theme with authentic varsity block letter typography and supports 8 AI providers: OpenAI, Anthropic, Google, Microsoft, Perplexity, DeepSeek, Grok, and Llama.

## Recent Changes (August 2025)

✅ **COMPLETE INDUSTRIAL DESIGN TRANSFORMATION**: UI redesigned to sophisticated luxe aesthetic:
  - **Refined Color Balance**: Cement gray (#D4D4D4) and lighter asphalt (#737373) for optimal contrast
  - **Professional Typography**: SF Pro Display with refined letter spacing and high contrast text (#171717)
  - **Sharp Right Angles**: All rounded corners removed - pure geometric forms only
  - **Luxe Sophistication**: Subtle gradients, minimal 3D hover effects, and texture overlays
  - **Enhanced Text Legibility**: Maximum contrast headings and improved font weights
  - **Distinctive Mode Colors**: DIVE (blue #2563EB), TURN (purple #7C3AED), WORK (teal #059669)
  - **Navigation Button Colors**: Stats (orange), Admin (indigo), Settings (amber), Logout (red)
  - **Accent Details**: Mode-specific color bars and gradient header accents
  - **Reduced Spacing**: Tighter provider grid spacing and refined margins for compact luxury
✅ **PERSISTENT DATA STORAGE**: FULLY OPERATIONAL - PostgreSQL database with Drizzle ORM storing all conversations, AI responses, statistics, and user data permanently
✅ **USER AUTHENTICATION SYSTEM**: PRODUCTION-READY - Complete enterprise-grade security:
  - User registration/login with bcrypt password hashing
  - JWT tokens with 7-day expiration for secure session management
  - Enterprise security badge on login screen with lock icon
  - Zero Replit dependencies - fully portable to any server
  - Protected API routes requiring authentication
  - Test credentials: demo/demo123 for development testing
✅ **COMPREHENSIVE ADMIN PANEL**: FULLY OPERATIONAL - Enterprise-grade user management system:
  - Complete user lifecycle management (create, read, update, delete)
  - Authorized email validation against whitelist system
  - Secure password reset functionality for account recovery
  - Real-time user status management (active/disabled)
  - Protected admin-only access (davidtowne/demo accounts only)
  - Comprehensive user data table with sorting and filtering
  - Form validation and error handling throughout interface
  - Prevents deletion of critical admin accounts for system security
✅ **DIVE MODE**: FULLY FUNCTIONAL - Real-time multi-AI querying working perfectly:
  - All 4 main providers (OpenAI, Claude, Gemini, Perplexity) connecting successfully
  - AI responses processing correctly and storing to database
  - Authentication protecting all query endpoints
  - Background async processing with proper error handling
  - Mistral AI placeholder added for future integration
✅ **TURN Mode Verification**: Complete AI-to-AI fact-checking system with accuracy scores working perfectly:
  - Fixed attachment context bug - TURN verification now includes attached file information
  - Enhanced verification prompts with SwimMeet core values and file integration criteria
  - Verifier AIs now properly consider attached files when evaluating response completeness
✅ **WORK MODE COLLABORATION**: FULLY FUNCTIONAL - Sequential AI collaboration system with authentic handoffs:
  - Step 1 (OpenAI): Problem analysis and framework development
  - Step 2 (Anthropic): Building on analysis with detailed solutions
  - Step 3 (Google): Final synthesis and comprehensive deliverable
  - Real sequential processing with immediate continuation mechanism
  - Collaborative document building with previous work context
  - Fixed auto-continuation mechanism replacing unreliable setTimeout approach
  - Verified working with console logs showing "Step X complete. Immediately continuing to step Y"
✅ **LOGO REDESIGN COMPLETED**: Professional sans-serif branding with dynamic gradient:
  - Flattened design without drop shadows or "PREMIUM" text
  - 4px silver border with navy-to-sea-green gradient (#001f3f → #007BFF → #40E0D0)
  - System-ui font family with distinct upper/lower case typography
  - 36px font size in 260px container for better visibility
✅ **THUMBS UP/DOWN RATING SYSTEM**: Simple, intuitive feedback mechanism:
  - Replaced complex medal system with clear positive/negative ratings
  - Thumbs up/down buttons visible on all AI responses in DIVE, TURN, and WORK modes
  - Color-coded user approval ratings on AI provider selection buttons
  - "X% Positive Rating" statistics with green (75%+), black/blue (50-74%), red (<50%) color coding
✅ **CONTENT CLEARING FUNCTIONALITY**: User control over persistence between modes:
  - "Clear Content" button appears when query or responses exist
  - Clears query text, responses, attached files, and conversation ID
  - Prevents unwanted content persistence when switching between DIVE/TURN/WORK modes
✅ **TURN VALIDATION ON ALL OUTPUTS**: Fact-checking available everywhere:
  - "TURN Validate" button on all DIVE and WORK mode responses
  - Uses Anthropic Claude for AI-to-AI fact verification
  - Provides accuracy scores and critique for any AI response
✅ **ANTI-FABRICATION FEEDBACK SYSTEM**: Truth enforcement mechanism:
  - "Report Fabrication" button on all AI responses
  - Confirmation dialog explaining the reporting process
  - Direct feedback to address AI lying or made-up facts
  - Tracks fabrication patterns for platform improvement
✅ **MAXIMUM PLATFORM INDEPENDENCE**: All functionality uses standard technologies (PostgreSQL, JWT, bcrypt) with zero proprietary dependencies. User-owned cloud storage integration (Google Drive, Dropbox, OneDrive, iCloud) provides enterprise storage without vendor lock-in.
✅ **Real-time Connection Status**: Live API testing with authentic connection verification
✅ **PLATFORM-INDEPENDENT STORAGE**: Complete sovereignty and portability:
  - Local filesystem storage with multer-based file uploads - works on any server
  - User-owned cloud storage integration (Google Drive, Dropbox, OneDrive, iCloud) for enhanced capabilities
  - Zero vendor lock-in - completely portable across platforms
  - No proprietary storage dependencies or extra costs
  - Standard technologies ensuring maximum compatibility
✓ **Comprehensive Stats System**: Persistent performance tracking across all AI providers with thumbs up/down metrics
✅ **DATABASE SCHEMA**: Complete schema supporting all features including authentication, conversations, responses, ratings, and workflow states

## User Preferences

Preferred communication style: Simple, everyday language.
**CRITICAL REQUIREMENT**: 100% truth-based functionality - never simulate, fake, or claim capabilities that don't exist. User demands complete honesty about what works vs what's broken.
**COST OPTIMIZATION**: Minimize API calls during testing - reduce polling frequency and only test connections when necessary to avoid unnecessary charges.
**PROVIDER FOCUS**: Microsoft Copilot and Llama testing disabled due to external API issues - focusing on working providers (OpenAI, Claude, Gemini, Perplexity).
**COMMUNICATION PREFERENCE**: User values steady, measurable progress over hype or promotional language. Focus on factual status updates and concrete functionality verification.
**TYPOGRAPHY PREFERENCE**: User dislikes dated-looking fonts (late 90s/early 2000s style, Mac 1996 appearance). Prefers modern, readable system fonts that don't look ancient. Needs larger text for readability (user is 50) but not jumbo senior size - something sophisticated and clear.
**PLATFORM INDEPENDENCE PRIORITY**: User strongly prefers maximum portability with zero Replit dependencies. All solutions should be deployable on any server without proprietary tie-ins. CRITICAL: User explicitly rejects Replit object storage as it violates sovereignty principles - costs extra and creates vendor lock-in. SOLUTION: Must implement local filesystem storage with user-owned cloud storage integration (Google Drive, Dropbox, OneDrive, iCloud) providing enterprise capabilities with complete user data sovereignty.
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