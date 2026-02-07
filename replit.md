# HarmoniQ - AI Music Generation Platform

## Overview

HarmoniQ is an AI-powered music and lyrics generation platform that allows users to create studio-quality lyrics and songs without musical experience. The application features a dark "Music Studio" aesthetic with a synthwave theme, providing tools for generating lyrics from text prompts, exploring public songs, and managing a personal music library.

The platform supports multiple AI engines (OpenAI for fast lyrics, Gemini for full song concepts), integrates with Replicate for audio generation (MusicGen short clips + ACE-Step 1.5 full songs with vocals), Stable Audio for instrumentals, Suno for professional studio-quality vocals, and uses Replit Auth for user authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### February 2026
- **AI Suggest Buttons**: Sparkle buttons on all text inputs (audio prompt, song title, lyrics, topic) that generate creative suggestions via OpenAI gpt-4o-mini
  - New endpoint: `POST /api/generate/ai-suggest` with Zod validation
  - Reusable `AiSuggestButton` component with tooltip and loading state
- **Model Names Fixed**: Updated all AI model references to current working versions
  - Suno: chirp-bluejay (v4.5+), chirp-auk (v4.5), chirp-v4, chirp-v3-5, chirp-v3-0
  - Replicate MusicGen: Updated to hash b05b1dff with stereo-melody-large variant
  - Stable Audio: Upgraded to 2.5 endpoints (fal-ai/stable-audio-25/text-to-audio)
- **Suno Default Engine**: Auto-selects Suno as default engine when configured, with chirp-bluejay (v4.5+) as preferred model
- **Vocals Tab Revamp**: Suno-based vocal generation as primary option, Bark AI as optional fallback
  - handleSunoGenerate accepts overrides for direct parameter passing
  - Progress tracking during vocal generation
- **Save to Library**: Generated songs now save directly to user's library from Studio page
- **Admin Unlimited Credits**: Set `ADMIN_USER_IDS` env var with comma-separated user IDs for unlimited access
- **Suno AI Integration**: Added professional music generation with realistic vocals
  - Full songs with singing (up to 8 minutes with chirp-bluejay)
  - Multiple music styles (Pop, Rock, Hip Hop, Electronic, etc.)
  - Model selection: chirp-v3-0, chirp-v3-5, chirp-v4, chirp-auk, chirp-bluejay
  - Optional custom lyrics or AI-generated
  - Instrumental-only mode
  - Environment variable: `DEFAPI_API_KEY` (recommended)
- **Security Audit**: Fixed command injection vulnerability in audio processing
  - Added input validation for all external process calls
  - Whitelisted allowed model names and parameters
- **PWA Auto-Update System**: Service worker now auto-updates on deployment
  - Build-timestamp versioning ensures cache invalidation
  - Users get latest version automatically after publish
  - No manual cache clearing required
- **Performance Optimizations**:
  - Smart cache headers (immutable for hashed assets, no-cache for HTML)
  - Preload hints for critical CSS/JS assets
  - Lazy loading for images
  - Reduced font payload
- **ACE-Step 1.5 Integration**: Added commercial-grade music generation with vocals via Replicate
  - Full songs with vocals, up to 4 minutes duration
  - Style tags-based prompting (genre, instruments, BPM, mood, vocalist type)
  - Optional custom lyrics with section markers ([Verse], [Chorus], [Bridge])
  - 50+ language support, commercial-grade quality
  - New service: `server/services/aceStep.ts`
  - New routes: `/api/ace-step/generate`, `/api/ace-step/status/:predictionId`, `/api/ace-step/config`
  - AI Suggest button for music tags generation
- **Style Reference Upload**: Upload reference audio to guide music generation style
  - MusicGen melody conditioning via Replicate
  - Accepts MP3, WAV, OGG, FLAC, AAC files (up to 10MB)
  - New route: `/api/audio/generate-with-reference` (multipart form upload via multer)
  - Available from the Studio Audio tab for any engine
- **Studio Page Engine Selector**: Suno (primary when configured), ACE-Step 1.5, Stable Audio, Replicate

### January 2026
- Added Search & Filtering to Dashboard and Explore pages (search, genre filter, mood filter, sorting)
- Added Playlists page with full CRUD operations for playlist management
- Added Playlist Details page to view and manage songs within playlists
- Added Favorites page to view all liked songs
- Added Settings page with profile display, dark mode toggle, and notification preferences
- Added song sharing features (copy lyrics, copy link, Twitter/Facebook sharing)
- Enhanced navigation sidebar with Playlists, Favorites, and Settings links
- Added Audio Visualizer page with circular equalizer, frequency spectrum, and waveform display
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
- **Multi-Engine Audio Generation**: Suno (studio vocals), ACE-Step 1.5 (commercial-grade full songs), Stable Audio (instrumentals up to 3 min), Replicate MusicGen (short clips 5-30s)
- **Style Reference Upload**: Upload reference audio for melody-conditioned generation via MusicGen
- **Music Theory Tools**: Chord progression generator, scale finder, production tips
- **AI Suggest**: Smart suggestion buttons across all text inputs for creative prompts, tags, lyrics, and titles
- **User Library**: Personal song management with CRUD operations
- **Public Explore**: Browse and like publicly shared songs
- **Playlist Management**: Create and manage song playlists

### Application Pages
- `/` - Landing page (redirects to dashboard if authenticated)
- `/dashboard` - User's song library with search and filtering
- `/generate` - AI lyrics generation with OpenAI/Gemini toggle
- `/studio` - Music studio with audio generation and music theory tools
- `/visualizer` - Interactive audio visualizer with synthwave aesthetic
- `/explore` - Browse public songs with search, filters, and sorting
- `/playlists` - Manage song playlists
- `/playlists/:id` - View playlist details and songs
- `/favorites` - View liked songs
- `/settings` - User profile, appearance, and notification settings
- `/songs/:id` - Song details view with sharing options

## External Dependencies

### AI Services
- **OpenAI API**: Used for fast lyrics generation, accessed via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  
- **Gemini API**: Used for comprehensive song concepts, accessed via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`

- **Replicate API**: Used for short audio/music generation (MusicGen model, 5-30s) and ACE-Step 1.5 (full songs with vocals, up to 4 min)
  - Environment variable: `REPLICATE_API_KEY`

- **Stable Audio (fal.ai)**: Used for extended duration music generation (up to 3 minutes)
  - Environment variable: `FAL_API_KEY` or `FAL_KEY`

- **Suno API (via DefAPI)**: Used for professional studio-quality music with realistic vocals (up to 4+ minutes)
  - Production base: https://api.defapi.org
  - Primary environment variable: `DEFAPI_API_KEY` (recommended)
  - Alternative providers: `KIE_API_KEY` (Kie.ai), `SUNO_API_KEY` (SunoAPI.org)
  - Set `SUNO_PROVIDER` to explicitly choose: "defapi", "kie", or "sunoorg"
  - Supports multiple models: v3, v3.5, v4, v4.5, v4.5+ (chirp-bluejay, recommended)
  - Features: Custom lyrics, instrumental-only mode, multiple styles, credit balance tracking
  - Polling: Exponential backoff (1.5s to 6s), max 2 minute wait

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

#### ACE-Step 1.5 Routes (Full Songs with Vocals via Replicate)
- `GET /api/ace-step/config` - Get ACE-Step configuration (duration options, features)
- `POST /api/ace-step/generate` - Start async song generation (returns predictionId)
- `GET /api/ace-step/status/:predictionId` - Check generation status

#### Style Reference Route
- `POST /api/audio/generate-with-reference` - Upload reference audio + prompt for style-conditioned generation (multipart form, MusicGen melody)

#### Suno Routes (Professional Music with Vocals via DefAPI)
- `GET /api/suno/status` - Check if Suno is configured, get provider/styles/models/pollingConfig
- `POST /api/suno/generate` - Start async song generation (forwards to DefAPI /api/suno/generate)
- `POST /api/suno/generate/start` - Start async song generation (same as above)
- `GET /api/suno/status/:taskId` - Check async generation status (forwards to DefAPI /api/task/query)
- `GET /api/suno/user` - Get user info and credit balance (forwards to DefAPI /api/user)
- `POST /api/suno/lyrics` - Generate lyrics only

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
