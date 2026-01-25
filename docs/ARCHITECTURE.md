# HarmoniQ System Architecture

This document describes the technical architecture of the HarmoniQ AI music generation platform.

## High-Level Overview

HarmoniQ is a full-stack TypeScript application that enables users to generate song lyrics and music using AI. The platform follows a modern web architecture with a React frontend, Express backend, and PostgreSQL database.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    React Application                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │  Wouter  │  │ TanStack │  │  shadcn  │  │   Tailwind   │   │ │
│  │  │ (Router) │  │  Query   │  │   /ui    │  │     CSS      │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Express.js Backend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │   Routes    │  │  Services   │  │      Replit Integrations    │ │
│  │  /api/*     │  │  (AI/Audio) │  │   (Auth, Chat, Image)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │
│                           │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Drizzle ORM                                   ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────┐
                    │      PostgreSQL         │
                    │   (Neon-backed on       │
                    │       Replit)           │
                    └─────────────────────────┘
```

## Frontend Architecture

### Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with TypeScript |
| **Wouter** | Lightweight client-side routing |
| **TanStack Query** | Server state management and data fetching |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Accessible UI components built on Radix UI |
| **Framer Motion** | Animation library |
| **Vite** | Build tool and dev server |

### Directory Structure

```
client/
├── src/
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles & theme
│   ├── components/
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   ├── SongCard.tsx     # Reusable song display
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/
│   │   ├── use-auth.ts      # Authentication hook
│   │   ├── use-songs.ts     # Song CRUD operations
│   │   └── use-toast.ts     # Toast notifications
│   ├── lib/
│   │   ├── queryClient.ts   # TanStack Query setup
│   │   ├── storage.ts       # localStorage utilities
│   │   └── utils.ts         # Shared utilities
│   └── pages/
│       ├── Landing.tsx      # Public landing page
│       ├── Dashboard.tsx    # User's song library
│       ├── Generate.tsx     # AI lyrics generation
│       ├── Studio.tsx       # Music production tools
│       ├── Explore.tsx      # Browse public songs
│       └── SongDetails.tsx  # Individual song view
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
└── replit_integrations/
    └── audio/               # Client-side audio utilities
```

### Routing

Routes are protected using a `ProtectedRoute` component that checks authentication status:

```
/               → Landing (public) or redirect to Dashboard
/dashboard      → Protected: User's song library
/generate       → Protected: AI lyrics generation
/studio         → Protected: Music production tools
/explore        → Protected: Browse public songs
/songs/:id      → Protected: Song details view
```

### State Management

- **Server State**: TanStack Query manages all API data with automatic caching, refetching, and invalidation
- **Local State**: React hooks (useState, useReducer) for UI state
- **Persistence**: localStorage for work-in-progress drafts

## Backend Architecture

### Technology Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **TypeScript** | Type safety (ES modules) |
| **Drizzle ORM** | Database operations |
| **Passport.js** | Authentication |
| **openid-client** | OpenID Connect for Replit Auth |

### Directory Structure

```
server/
├── index.ts                 # Server entry point
├── routes.ts                # API route definitions
├── storage.ts               # Database operations (IStorage)
├── db.ts                    # Database connection
├── static.ts                # Static file serving
├── vite.ts                  # Vite dev server integration
├── services/
│   ├── gemini.ts            # Gemini AI integration
│   ├── replicate.ts         # Replicate (MusicGen, Bark)
│   └── stableAudio.ts       # fal.ai Stable Audio
└── replit_integrations/
    ├── auth/                # Replit Auth setup
    ├── chat/                # Chat functionality
    ├── image/               # Image generation
    ├── audio/               # Audio utilities
    └── batch/               # Batch processing
```

### API Design

The API follows RESTful conventions with typed contracts defined in `shared/routes.ts`. This ensures type safety across frontend and backend.

```typescript
// Example API contract
export const api = {
  songs: {
    create: {
      method: 'POST',
      path: '/api/songs',
      input: insertSongSchema.omit({ userId: true }),
      responses: { 201: songSchema, 400: errorSchema }
    }
  }
};
```

## Data Layer

### Database Schema

```
┌─────────────┐       ┌───────────────┐       ┌─────────────┐
│   users     │       │     songs     │       │  playlists  │
├─────────────┤       ├───────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)       │   ┌───│ id (PK)     │
│ username    │  │    │ userId (FK)   │──┘    │ userId (FK) │
│ email       │  └────│ title         │       │ name        │
│ image       │       │ lyrics        │       │ description │
│ firstName   │       │ genre         │       │ isPublic    │
│ lastName    │       │ mood          │       │ createdAt   │
│ createdAt   │       │ audioUrl      │       └─────────────┘
└─────────────┘       │ isPublic      │              │
                      │ playCount     │              │
                      │ likeCount     │       ┌──────┴───────┐
                      │ createdAt     │       │              │
                      └───────────────┘       ▼              │
                             │         ┌─────────────┐       │
                             │         │playlistSongs│       │
                      ┌──────┴───────┐ ├─────────────┤       │
                      │              │ │ id (PK)     │       │
                      ▼              │ │ playlistId  │───────┘
                ┌───────────┐        │ │ songId      │
                │ songLikes │        │ │ addedAt     │
                ├───────────┤        │ └─────────────┘
                │ id (PK)   │        │
                │ userId    │────────┘
                │ songId    │
                │ createdAt │
                └───────────┘
```

### Storage Pattern

Database operations are abstracted through an `IStorage` interface:

```typescript
interface IStorage {
  // Songs
  getSongs(userId: string): Promise<Song[]>;
  getSong(id: number): Promise<Song | null>;
  createSong(data: InsertSong): Promise<Song>;
  deleteSong(id: number): Promise<void>;
  
  // Playlists
  getPlaylists(userId: string): Promise<Playlist[]>;
  createPlaylist(data: InsertPlaylist): Promise<Playlist>;
  
  // Likes
  toggleLike(userId: string, songId: number): Promise<LikeResult>;
}
```

## AI Services Integration

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HarmoniQ Backend                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────────┐   │
│  │    OpenAI     │    │    Gemini     │    │     Replicate     │   │
│  │   Service     │    │   Service     │    │     Service       │   │
│  ├───────────────┤    ├───────────────┤    ├───────────────────┤   │
│  │ - Fast lyrics │    │ - Song concept│    │ - MusicGen        │   │
│  │   generation  │    │ - Music theory│    │   (5-30s audio)   │   │
│  │               │    │ - Production  │    │ - Bark (vocals)   │   │
│  │               │    │   tips        │    │                   │   │
│  └───────┬───────┘    └───────┬───────┘    └─────────┬─────────┘   │
│          │                    │                      │              │
│          ▼                    ▼                      ▼              │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │               Replit AI Integrations                          │ │
│  │  (Manages API keys: AI_INTEGRATIONS_OPENAI_API_KEY, etc.)     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    fal.ai (Stable Audio)                       │ │
│  │           Extended duration music (up to 3 minutes)           │ │
│  │                 Uses: FAL_API_KEY or FAL_KEY                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Technology | Capabilities |
|---------|------------|--------------|
| **OpenAI** | GPT-4o | Fast lyrics generation |
| **Gemini** | Gemini Pro | Full song concepts, music theory, production tips |
| **Replicate** | MusicGen | Short audio clips (5-30 seconds) |
| **Replicate** | Bark | AI singing vocals |
| **fal.ai** | Stable Audio | Extended duration tracks (up to 3 minutes) |

## Authentication Flow

HarmoniQ uses Replit Auth with OpenID Connect:

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │     │   Express    │     │  Replit OIDC │
│ (Browser)│     │   Backend    │     │   Provider   │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                     │
     │  1. Click Login  │                     │
     │─────────────────>│                     │
     │                  │  2. Redirect to     │
     │                  │     /api/login      │
     │                  │────────────────────>│
     │                  │                     │
     │                  │  3. OIDC Auth Flow  │
     │<──────────────────────────────────────>│
     │                  │                     │
     │                  │  4. Callback with   │
     │                  │     tokens          │
     │                  │<────────────────────│
     │                  │                     │
     │  5. Session      │                     │
     │     Cookie Set   │                     │
     │<─────────────────│                     │
     │                  │                     │
     │  6. Authenticated│                     │
     │     Requests     │                     │
     │─────────────────>│                     │
```

### Session Management

- Sessions are stored in PostgreSQL using `connect-pg-simple`
- Session cookies are HTTP-only for security
- The `isAuthenticated` middleware validates session on protected routes

## Data Flow Examples

### Lyrics Generation Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │     │   Backend    │     │    OpenAI    │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                     │
     │  POST /api/      │                     │
     │  generate/lyrics │                     │
     │  {prompt, genre} │                     │
     │─────────────────>│                     │
     │                  │                     │
     │                  │  Create completion  │
     │                  │  with system prompt │
     │                  │────────────────────>│
     │                  │                     │
     │                  │  {title, lyrics}    │
     │                  │<────────────────────│
     │                  │                     │
     │  {title, lyrics} │                     │
     │<─────────────────│                     │
```

### Audio Generation Flow (Async)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │     │   Backend    │     │  fal.ai      │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘
     │                  │                     │
     │  POST /api/      │                     │
     │  stable-audio/   │                     │
     │  start           │                     │
     │─────────────────>│                     │
     │                  │  Submit to queue    │
     │                  │────────────────────>│
     │                  │                     │
     │                  │  {requestId}        │
     │                  │<────────────────────│
     │                  │                     │
     │  {requestId}     │                     │
     │<─────────────────│                     │
     │                  │                     │
     │  GET /api/       │                     │
     │  stable-audio/   │                     │
     │  status/:id      │                     │
     │─────────────────>│                     │
     │                  │  Check queue status │
     │                  │────────────────────>│
     │                  │                     │
     │                  │  {status, audioUrl} │
     │                  │<────────────────────│
     │  Poll until      │                     │
     │  complete        │                     │
     │<─────────────────│                     │
```

## Shared Types

The `shared/` directory contains type definitions used by both frontend and backend:

```
shared/
├── schema.ts          # Database schema & Zod validation
├── routes.ts          # API contract definitions
└── models/
    ├── auth.ts        # User types
    └── chat.ts        # Chat types
```

This ensures:
- Type safety across the full stack
- Single source of truth for data shapes
- Automatic validation with Zod schemas

## PWA Support

HarmoniQ is a Progressive Web App with:

- **manifest.json**: App metadata, icons, theme colors
- **Service Worker**: Offline caching for static assets
- **Lazy Loading**: Routes load on demand using React.lazy

## Performance Considerations

1. **Lazy Loading**: All page components are loaded on demand
2. **Query Caching**: TanStack Query caches API responses
3. **Optimistic Updates**: UI updates immediately while mutations process
4. **Connection Pooling**: Database connections are pooled for efficiency
