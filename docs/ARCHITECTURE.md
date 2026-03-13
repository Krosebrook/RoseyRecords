# HarmoniQ System Architecture

**Last Updated:** 2026-03-13
**Version:** Post-audit

## System Overview

HarmoniQ is a monorepo full-stack TypeScript application for AI-powered music generation. A single Node.js process serves both the Express API and the React frontend on port 5000.

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                  │
│  React 18 · Wouter · TanStack Query · Tailwind CSS │
│  Vite Dev Server (dev) / Static Files (prod)        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / JSON (session cookies)
┌──────────────────────▼──────────────────────────────┐
│              Express.js API Server                  │
│  Security Headers · JSON Parser · Logging           │
│  Replit Auth (OIDC) · Passport · Session Store      │
│  Rate Limiting (AI: 50/15m, Write: 100/15m)         │
├─────────────────────────────────────────────────────┤
│  Route Layer (server/routes.ts)                     │
│  Songs · Playlists · Likes · Generation · Theory    │
│  Bark · Suno · Stable Audio · ACE-Step · Upload     │
├─────────────────────────────────────────────────────┤
│  Service Layer (server/services/)                   │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐          │
│  │  OpenAI  │ │  Gemini  │ │ Replicate  │          │
│  │ gpt-5.2  │ │ gemini-  │ │ MusicGen + │          │
│  │ (lyrics, │ │ 3-pro-   │ │ Bark       │          │
│  │ suggest) │ │ preview  │ │ (vocals)   │          │
│  └──────────┘ └──────────┘ └────────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐          │
│  │ Suno/    │ │ Stable   │ │  ACE-Step  │          │
│  │ DefAPI   │ │ Audio    │ │  1.5       │          │
│  │ (vocals) │ │ (fal.ai) │ │ (full song)│          │
│  └──────────┘ └──────────┘ └────────────┘          │
├─────────────────────────────────────────────────────┤
│  Storage Layer (server/storage.ts)                  │
│  IStorage interface → DatabaseStorage (Drizzle ORM) │
└──────────────────────┬──────────────────────────────┘
                       │ SQL (node-postgres Pool)
┌──────────────────────▼──────────────────────────────┐
│              PostgreSQL 16                          │
│  users · sessions · songs · playlists               │
│  playlist_songs · song_likes · conversations · msgs │
└─────────────────────────────────────────────────────┘
```

## Directory Structure

```
/
├── client/                     # Frontend (React)
│   ├── index.html              # HTML entry point
│   ├── public/sw.js            # Service worker (PWA offline caching)
│   ├── replit_integrations/    # Audio playback/recording hooks
│   │   └── audio/              # useAudioPlayback, useVoiceRecorder, useVoiceStream
│   └── src/
│       ├── App.tsx             # Router (wouter), providers, lazy-loaded pages
│       ├── main.tsx            # ReactDOM entry point
│       ├── components/
│       │   ├── ui/             # ~40 shadcn/ui components (Radix-based)
│       │   ├── Layout.tsx      # Sidebar + main content layout
│       │   ├── SongCard.tsx    # Reusable song card with play/like/delete
│       │   ├── AiSuggestButton.tsx  # AI suggestion button for inputs
│       │   └── Onboarding.tsx  # First-run tour walkthrough
│       ├── hooks/
│       │   ├── use-auth.ts     # Authentication state & logout
│       │   ├── use-songs.ts    # Song CRUD queries/mutations
│       │   ├── use-playlists.ts # Playlist queries/mutations
│       │   ├── use-public-songs.ts # Public explore queries
│       │   ├── use-chat-generation.ts # AI chat hook
│       │   ├── use-page-title.ts # Dynamic document titles
│       │   ├── use-debounce.ts # Debounce utility
│       │   ├── use-mobile.tsx  # Responsive breakpoint detection
│       │   └── use-toast.ts    # Toast notification hook
│       ├── lib/
│       │   ├── queryClient.ts  # TanStack Query client + apiRequest helper
│       │   ├── storage.ts      # localStorage wrappers (drafts, settings)
│       │   ├── auth-utils.ts   # Auth utility functions
│       │   └── utils.ts        # cn(), copyToClipboard, formatDuration
│       └── pages/              # 16 route pages (all lazy-loaded)
│           ├── Landing.tsx     # Public landing page
│           ├── Dashboard.tsx   # User's song library
│           ├── Generate.tsx    # Lyrics generation (OpenAI/Gemini)
│           ├── Studio.tsx      # Full music studio (audio/vocals/theory)
│           ├── Explore.tsx     # Public song browsing
│           ├── SongDetails.tsx # Individual song view
│           ├── Visualizer.tsx  # Audio visualizer
│           ├── Playlists.tsx   # Playlist management
│           ├── PlaylistDetails.tsx
│           ├── Favorites.tsx   # Liked songs
│           ├── Settings.tsx    # User settings
│           ├── Marketplace.tsx # Sound packs (Coming Soon)
│           ├── Mixer.tsx       # Mixing console (Coming Soon)
│           ├── Activity.tsx    # Activity feed (Coming Soon)
│           ├── VideoCreator.tsx # Video creator (Coming Soon)
│           └── not-found.tsx   # 404 page
├── server/
│   ├── index.ts                # Express app bootstrap, security headers, logging
│   ├── routes.ts               # All API route handlers (~1183 lines)
│   ├── storage.ts              # IStorage interface + DatabaseStorage class
│   ├── db.ts                   # Drizzle ORM + pg Pool initialization
│   ├── middleware.ts           # RateLimiter class (aiRateLimiter, writeRateLimiter)
│   ├── utils.ts                # sanitizeLog, detectAudioFormat, parseNumericId
│   ├── static.ts               # Production static file serving
│   ├── vite.ts                 # Vite dev server integration
│   ├── services/
│   │   ├── suno.ts             # Multi-provider Suno client (DefAPI/Kie/SunoOrg)
│   │   ├── gemini.ts           # Google Gemini (concepts, theory, analysis)
│   │   ├── replicate.ts        # MusicGen + Bark vocals via Replicate
│   │   ├── stableAudio.ts      # Stable Audio via fal.ai
│   │   └── aceStep.ts          # ACE-Step 1.5 via Replicate
│   └── replit_integrations/
│       ├── auth/               # Replit OIDC auth (Passport, sessions)
│       ├── chat/               # AI chat conversations (OpenAI)
│       ├── image/              # AI image generation
│       ├── audio/              # Audio integration (defined but unmounted)
│       └── batch/              # Batch processing utilities
├── shared/
│   ├── schema.ts               # Drizzle tables, Zod schemas, TypeScript types
│   ├── routes.ts               # API contract definitions (paths, methods, schemas)
│   └── models/
│       ├── auth.ts             # users + sessions tables
│       └── chat.ts             # conversations + messages tables
├── script/build.ts             # Production build script (esbuild)
├── docs/                       # Project documentation
└── Config: tsconfig.json, vite.config.ts, drizzle.config.ts,
    tailwind.config.ts, postcss.config.js, .replit
```

## Database Schema

### Entity-Relationship Diagram

```
users (varchar PK)
  ├── 1:N → songs (userId FK)
  ├── 1:N → playlists (userId FK)
  └── 1:N → song_likes (userId FK)

songs (serial PK)
  ├── N:1 → users (userId FK)
  ├── 1:N → song_likes (songId FK, CASCADE)
  └── M:N → playlists (via playlist_songs, CASCADE)

playlists (serial PK)
  ├── N:1 → users (userId FK)
  └── 1:N → playlist_songs (playlistId FK, CASCADE)

conversations (serial PK)
  └── 1:N → messages (conversationId FK, CASCADE)

sessions (varchar PK "sid")
  └── Managed by connect-pg-simple (auto-expire)
```

### Table Definitions

| Table | Columns | Notes |
|---|---|---|
| `users` | `id` (varchar PK), `email` (unique), `firstName`, `lastName`, `profileImageUrl`, `createdAt`, `updatedAt` | Managed by Replit Auth upsert |
| `sessions` | `sid` (varchar PK), `sess` (jsonb), `expire` (timestamp) | Auto-created by connect-pg-simple |
| `songs` | `id` (serial PK), `userId` (FK), `title`, `lyrics`, `description`, `genre`, `mood`, `creationMode`, `hasVocal`, `vocalGender`, `recordingType`, `audioUrl`, `imageUrl`, `isPublic`, `playCount`, `likeCount`, `createdAt` | Core entity |
| `playlists` | `id` (serial PK), `userId` (FK), `name`, `description`, `imageUrl`, `isPublic`, `createdAt` | |
| `playlist_songs` | `id` (serial PK), `playlistId` (FK CASCADE), `songId` (FK CASCADE), `addedAt` | Junction table |
| `song_likes` | `id` (serial PK), `userId` (FK), `songId` (FK CASCADE), `createdAt` | |
| `conversations` | `id` (serial PK), `title`, `createdAt` | AI chat |
| `messages` | `id` (serial PK), `conversationId` (FK CASCADE), `role`, `content`, `createdAt` | |

## Authentication Flow

1. User clicks "Login with Replit" → `GET /api/login`
2. Redirect to Replit OIDC provider (`ISSUER_URL`)
3. User authenticates on Replit → redirect to `GET /api/callback`
4. Server exchanges authorization code for tokens via `openid-client`
5. User upserted into `users` table (id, email, name, avatar)
6. Session created: `connect-pg-simple` stores in `sessions` table (7-day TTL)
7. Session cookie set: `httpOnly: true`, `secure: true` (no explicit `sameSite`)
8. Subsequent requests: `passport.session()` middleware restores `req.user`
9. Protected routes: `isAuthenticated` middleware → 401 if no valid session
10. Logout: `GET /api/logout` → session destroyed, cookie cleared

## Deployment Topology

```
┌──────────────────────────┐
│   Replit Autoscale        │
│   Deployment Target       │
├──────────────────────────┤
│ Build: npm run build      │
│   └─ tsx script/build.ts  │
│   └─ esbuild → dist/     │
│      ├─ index.cjs (server)│
│      └─ public/ (client)  │
├──────────────────────────┤
│ Run: node dist/index.cjs  │
│   PORT=5000 (→ ext:80)    │
│   NODE_ENV=production      │
└───────────┬──────────────┘
            │
┌───────────▼──────────────┐
│   PostgreSQL 16           │
│   (Replit-managed)        │
│   DATABASE_URL env var    │
└──────────────────────────┘
```

## State Management

| Layer | Technology | Purpose |
|---|---|---|
| Server state | TanStack React Query | Fetch, cache, and invalidate API data |
| Local UI state | React hooks | Form inputs, toggles, modal state |
| Persistent client | localStorage | Drafts, generation settings, onboarding status |
| Auth state | Session cookie + `useAuth` hook | Current user, login/logout |
| URL state | Wouter router | Page navigation, route params |

## Key Design Patterns

1. **Shared Type Contract**: `shared/schema.ts` defines Drizzle tables + Zod schemas; `shared/routes.ts` defines API paths, methods, and I/O schemas — both used by frontend and backend
2. **Storage Abstraction**: `IStorage` interface decouples `routes.ts` from database implementation
3. **Service Layer**: Each AI provider has a dedicated module in `server/services/` with typed params/results
4. **Multi-Provider Pattern**: Suno uses a `MusicProvider` interface with 3 implementations (DefAPI, Kie, SunoOrg) selected by env var at runtime
5. **Atomic Database Operations**: Play counts and likes use SQL-level atomic increments (`COALESCE + 1`) with `RETURNING` to prevent race conditions
6. **Lazy Loading**: All 16 pages use `React.lazy()` + `Suspense` for code splitting
7. **Rate Limiting**: Custom in-memory rate limiter with per-user/IP tracking and automatic cleanup
8. **Input Validation**: Zod schemas for request body validation, `parseNumericId` for route params
