# HarmoniQ - AI Music Generation Platform

## Overview

HarmoniQ is an AI-powered music and lyrics generation platform that allows users to create studio-quality lyrics and songs without musical experience. The application features a dark "Music Studio" aesthetic with a synthwave theme, providing tools for generating lyrics from text prompts, exploring public songs, and managing a personal music library.

The platform supports multiple AI engines (OpenAI for fast lyrics, Gemini for full song concepts), integrates with Replicate for audio generation, and uses Replit Auth for user authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 2026
- Added AI-guided user onboarding with interactive walkthrough tours
- Added usePageTitle hook for dynamic browser titles across all pages
- Updated HarmoniQ branding throughout UI (hero, feature cards, footer)
- Added Gemini AI integration for advanced song concept generation (BPM, key, energy analysis)
- Added Replicate integration for AI music/audio generation (short clips, 5-30s)
- Added Stable Audio integration via fal.ai for extended duration tracks (up to 3 minutes)
- Created Music Studio page with sample-first workflow (15s preview → full track)
- Added AI engine selector (OpenAI vs Gemini) to Generate page
- Implemented chord progression generator and scale finder tools
- Audio player with progress bar and seek functionality for longer tracks
- Added Bark AI singing vocals via Replicate (true singing, not spoken)
- Added Vocals tab to Studio page with voice selection and temperature controls
- Added Mix tab for combining instrumentals and vocals with volume/delay controls
- Implemented PWA with manifest.json, service worker, and offline caching
- Added lazy loading for all routes using React.lazy and Suspense
- Added localStorage utilities for saving work-in-progress drafts

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom CSS variables for theming (dark synthwave theme)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for complex animations
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **API Pattern**: RESTful API with typed route contracts in `shared/routes.ts`
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod integration for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)

### Key Design Patterns
1. **Shared Types**: The `shared/` directory contains schema definitions and route contracts used by both frontend and backend, ensuring type safety across the stack
2. **Integration Modules**: Replit integrations (auth, chat, image, audio) are organized in `server/replit_integrations/` with separate client utilities in `client/replit_integrations/`
3. **Storage Abstraction**: Database operations are abstracted through storage interfaces (e.g., `IStorage` in `server/storage.ts`)
4. **Protected Routes**: Frontend uses a `ProtectedRoute` component pattern for authentication-gated pages

### Core Features
- **Dual AI Lyrics Generation**: Choose between OpenAI (fast) or Gemini (comprehensive song concepts)
- **Audio Generation**: AI-powered instrumental music creation via Replicate
- **Music Theory Tools**: Chord progression generator, scale finder, production tips
- **User Library**: Personal song management with CRUD operations
- **Public Explore**: Browse and like publicly shared songs
- **Playlist Management**: Create and manage song playlists

### Application Pages
- `/` - Landing page (redirects to dashboard if authenticated)
- `/dashboard` - User's song library
- `/generate` - AI lyrics generation with OpenAI/Gemini toggle
- `/studio` - Music studio with audio generation and music theory tools
- `/explore` - Browse public songs
- `/songs/:id` - Song details view

## External Dependencies

### AI Services
- **OpenAI API**: Used for fast lyrics generation, accessed via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  
- **Gemini API**: Used for comprehensive song concepts, accessed via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`

- **Replicate API**: Used for short audio/music generation (MusicGen model, 5-30s)
  - Environment variable: `REPLICATE_API_KEY`

- **Stable Audio (fal.ai)**: Used for extended duration music generation (up to 3 minutes)
  - Environment variable: `FAL_API_KEY` or `FAL_KEY`

### API Routes

#### Generation Routes
- `POST /api/generate/lyrics` - OpenAI lyrics generation
- `POST /api/generate/song-concept` - Gemini full song concept
- `POST /api/generate/lyrics-gemini` - Gemini lyrics only
- `POST /api/generate/production-tips` - AI production advice
- `POST /api/generate/analyze-lyrics` - Analyze existing lyrics
- `POST /api/generate/cover-art-prompt` - Generate album art prompts

#### Music Theory Routes
- `POST /api/music-theory/chord-progression` - Generate chord progressions
- `POST /api/music-theory/reharmonize` - Reharmonize existing progressions
- `POST /api/music-theory/lookup-scales` - Identify scales from notes

#### Audio Routes (Replicate - Short Clips)
- `POST /api/audio/generate` - Synchronous audio generation (5-30s)
- `POST /api/audio/generate/start` - Async audio generation (returns prediction ID)
- `GET /api/audio/status/:predictionId` - Check generation status
- `POST /api/audio/sound-effect` - Generate sound effects

#### Stable Audio Routes (fal.ai - Extended Duration)
- `POST /api/stable-audio/sample` - Generate 15s sample preview
- `POST /api/stable-audio/full` - Generate full track (up to 3 minutes)
- `POST /api/stable-audio/start` - Start async generation for longer tracks
- `GET /api/stable-audio/status/:requestId` - Check async generation status
- `POST /api/stable-audio/transform` - Transform existing audio

#### Bark Routes (Singing AI via Replicate)
- `GET /api/bark/voices` - List available singing voice presets
- `POST /api/bark/generate` - Generate singing vocals from lyrics
- `POST /api/bark/generate/start` - Start async singing generation
- `GET /api/bark/status` - Check if Bark (Replicate) is configured

### Database
- **PostgreSQL**: Primary data store for users, sessions, songs, playlists, and conversations
  - Environment variable: `DATABASE_URL`

### Authentication
- **Replit Auth**: OpenID Connect-based authentication
  - Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Frontend Libraries
- Radix UI primitives for accessible components
- TanStack React Query for data fetching
- Framer Motion for animations
- date-fns for date formatting

### Backend Libraries
- Passport.js with openid-client for authentication
- express-session with connect-pg-simple for session storage
- Drizzle ORM for database operations
- Replicate SDK for audio generation
- @google/genai for Gemini integration
