# HarmoniQ - AI Music Generation Platform

## Overview

HarmoniQ is an AI-powered platform for generating studio-quality music and lyrics, designed for users without musical experience. It features a dark "Music Studio" aesthetic with a synthwave theme. Key capabilities include generating lyrics from text prompts, creating full songs with vocals, exploring public music, and managing a personal music library. The platform integrates multiple AI engines for diverse generation tasks, aiming to provide a comprehensive music creation experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom CSS variables (dark synthwave theme), shadcn/ui component library
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **API Pattern**: RESTful API with typed route contracts (`shared/routes.ts`)
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod for schema validation
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit

### Key Design Patterns
1. **Shared Types**: `shared/` directory for type safety across frontend and backend.
2. **Integration Modules**: Organized integration points for Replit services and other external APIs.
3. **Storage Abstraction**: Database operations abstracted through interfaces.
4. **Protected Routes**: Frontend uses a `ProtectedRoute` component for authentication.

### Core Features
- **Dual AI Lyrics Generation**: OpenAI for fast lyrics, Gemini for comprehensive song concepts.
- **Multi-Engine Audio Generation**: Suno (studio vocals), ACE-Step 1.5 (commercial-grade full songs), Stable Audio (instrumentals), Replicate MusicGen (short clips).
- **Style Reference Upload**: Use reference audio to guide MusicGen.
- **Music Theory Tools**: Chord progression generator, scale finder, production tips.
- **AI Suggest**: Smart suggestion buttons for creative inputs across the platform.
- **User Library**: Personal song management.
- **Public Explore**: Browse and interact with publicly shared songs.
- **Playlist Management**: Create and manage song playlists.
- **PWA Capabilities**: Offline caching and auto-updates.

### UI/UX Decisions
- Dark "Music Studio" aesthetic with a synthwave theme.
- Interactive audio visualizer.
- AI-guided user onboarding.

## External Dependencies

### AI Services
- **OpenAI API**: For fast lyrics and AI suggestions.
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Gemini API**: For comprehensive song concepts.
  - Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`
- **Replicate API**: For MusicGen (short audio/music) and ACE-Step 1.5 (full songs with vocals).
  - Environment variable: `REPLICATE_API_KEY`
- **Stable Audio (fal.ai)**: For extended duration instrumental music generation.
  - Environment variable: `FAL_API_KEY` or `FAL_KEY`
- **Suno API (via DefAPI)**: For professional studio-quality music with realistic vocals.
  - Environment variable: `DEFAPI_API_KEY` (recommended)
  - Supports models like chirp-bluejay (v4.5+).

### Database
- **PostgreSQL**: Primary data store for users, songs, playlists.
  - Environment variable: `DATABASE_URL`

### Authentication
- **Replit Auth**: OpenID Connect-based authentication.
  - Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`