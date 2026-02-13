# HarmoniQ - AI Music Generation Platform

HarmoniQ is an AI-powered music and lyrics generation platform that enables users to create studio-quality songs without musical experience. Built with a modern tech stack and featuring a sleek synthwave aesthetic.

## Features

### AI Lyrics Generation
- **Dual AI Engines**: Choose between OpenAI (fast) or Google Gemini (comprehensive song concepts)
- **Smart Generation**: Generate verses, choruses, bridges with proper structure
- **Genre-Aware**: Lyrics adapt to selected genre and mood
- **Song Concepts**: Gemini provides full song concepts including BPM, key, and energy analysis

### Music Studio
- **Instrumental Generation**: Create AI-powered instrumental tracks up to 3 minutes
- **Sample-First Workflow**: Generate 15-second previews before committing to full tracks
- **Singing Vocals**: Generate AI singing vocals with Bark integration
- **Mix Tab**: Combine instrumentals and vocals with volume/delay controls
- **Music Theory Tools**: Chord progression generator, scale finder, production tips

### Audio Visualizer
- Interactive audio visualizer with synthwave aesthetic
- Circular equalizer, frequency spectrum, and waveform displays
- Upload and play your own audio files

### User Features
- **Personal Library**: Save and manage your generated songs
- **Public Explore**: Browse and like publicly shared songs
- **Playlist Management**: Create and organize song playlists
- **PWA Support**: Install as a progressive web app with offline caching

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and builds
- Tailwind CSS with custom synthwave theme
- shadcn/ui component library (Radix UI)
- Framer Motion for animations
- TanStack React Query for data fetching
- Wouter for routing

### Backend
- Node.js with Express.js
- TypeScript (ES modules)
- PostgreSQL database with Drizzle ORM
- Passport.js with OpenID Connect (Replit Auth)

### AI Services
- OpenAI API for fast lyrics generation
- Google Gemini for comprehensive song concepts
- Replicate API for short audio clips (MusicGen)
- Stable Audio (fal.ai) for extended duration tracks
- Bark for AI singing vocals

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- API keys for AI services

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
SESSION_SECRET=your-session-secret
ISSUER_URL=your-replit-issuer-url
REPL_ID=your-repl-id

# AI Services (via Replit integrations)
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_OPENAI_BASE_URL=...
AI_INTEGRATIONS_GEMINI_API_KEY=...
AI_INTEGRATIONS_GEMINI_BASE_URL=...

# Audio Generation
REPLICATE_API_KEY=your-replicate-key
FAL_API_KEY=your-fal-key
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
harmoniq/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   ├── pages/          # Page components
│   │   └── replit_integrations/  # Client-side integrations
│   └── index.html
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── index.ts            # Server entry point
│   └── replit_integrations/  # Server-side integrations
├── shared/                 # Shared types and schemas
│   ├── schema.ts           # Drizzle database schema
│   └── routes.ts           # API route contracts
└── drizzle/                # Database migrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Branch Management

This repository includes automated merge tooling:

- `scripts/merge-manager.sh` - Automated merge orchestration
- `scripts/pre-merge-check.sh` - Validation before merge
- `scripts/cleanup-branches.sh` - Post-merge cleanup

See `docs/MERGE_EXECUTION_GUIDE.md` for complete instructions.

## License

MIT License - See LICENSE file for details.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.
