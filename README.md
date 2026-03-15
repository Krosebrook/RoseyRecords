# HarmoniQ - AI Music Generation Platform

HarmoniQ is an AI-powered music and lyrics generation platform that enables users to create studio-quality songs without musical experience. Built with a modern tech stack and featuring a sleek synthwave aesthetic.

## Features

### AI Lyrics Generation
- **Dual AI Engines**: Choose between OpenAI (fast) or Google Gemini (comprehensive song concepts)
- **Smart Generation**: Generate verses, choruses, bridges with proper structure
- **Genre-Aware**: Lyrics adapt to selected genre and mood
- **Song Concepts**: Gemini provides full song concepts including BPM, key, and energy analysis
- **AI Suggest**: Smart suggestion buttons for creative inputs across the platform

### Multi-Engine Audio Generation
- **Suno/DefAPI**: Studio-quality full songs with realistic vocals (chirp-bluejay, chirp-crow models)
- **ACE-Step 1.5**: Commercial-grade full songs with vocals via Replicate
- **Stable Audio**: Extended instrumentals up to 3 minutes via fal.ai
- **MusicGen**: Short instrumental clips for rapid iteration via Replicate
- **Bark Vocals**: AI singing with 10 voice presets (5 male, 5 female)

### Music Studio
- Audio generation tab with genre and duration controls
- Vocals tab with Bark AI singing
- Mix tab for combining instrumentals and vocals
- Music Theory tools: chord progression generator, scale finder, production tips

### Audio Visualizer
- Interactive synthwave-themed visualizer
- Circular equalizer, frequency spectrum, and waveform displays
- Audio file upload and playback

### User Features
- **Personal Library**: Save and manage generated songs
- **Public Explore**: Browse and like publicly shared songs
- **Playlist Management**: Create and organize playlists
- **PWA Support**: Install as a progressive web app with offline caching
- **AI-Guided Onboarding**: Interactive walkthrough tours for new users

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite 7 for development and builds
- Tailwind CSS with custom synthwave theme
- shadcn/ui component library (Radix UI)
- Framer Motion for animations
- TanStack React Query v5 for data fetching
- Wouter for routing

### Backend
- Node.js 20 with Express.js
- TypeScript (ES modules)
- PostgreSQL 16 with Drizzle ORM
- Passport.js with OpenID Connect (Replit Auth)
- Custom rate limiting (AI: 50/15min, Write: 100/15min)

### AI Services
- OpenAI (gpt-5.2) for fast lyrics and AI suggestions
- Google Gemini (gemini-3-pro-preview) for song concepts and music theory
- Replicate for MusicGen, Bark vocals, and ACE-Step 1.5
- Stable Audio (fal.ai) for extended instrumentals
- Suno via DefAPI for studio-quality vocals

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- API keys for AI services (see `.env.example`)

### Installation

```bash
npm install
npm run db:push
npm run dev
```

The application runs at `http://localhost:5000`.

### Environment Variables

Copy `.env.example` and fill in your values. Required variables:

```bash
DATABASE_URL=                           # PostgreSQL connection string
SESSION_SECRET=                         # Cookie signing secret
ISSUER_URL=https://replit.com/oidc      # Replit OIDC issuer
REPL_ID=                                # Replit project ID
AI_INTEGRATIONS_OPENAI_API_KEY=         # OpenAI API key
AI_INTEGRATIONS_OPENAI_BASE_URL=        # OpenAI base URL
AI_INTEGRATIONS_GEMINI_API_KEY=         # Gemini API key
AI_INTEGRATIONS_GEMINI_BASE_URL=        # Gemini base URL
```

Optional (enable additional engines): `REPLICATE_API_KEY`, `FAL_API_KEY`, `DEFAPI_API_KEY`

See `.env.example` for the complete list of 20+ environment variables.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema changes to database |
| `npx drizzle-kit studio` | Open Drizzle Studio |

## Documentation

All documentation lives in the `docs/` directory:

| Document | Purpose |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, schema, auth flow |
| [API.md](docs/API.md) | Complete API endpoint documentation |
| [DATABASE.md](docs/DATABASE.md) | Schema definitions, indexes, migration strategy |
| [PRD.md](docs/PRD.md) | Product requirements and feature status |
| [ROADMAP.md](docs/ROADMAP.md) | Version history and planned features |
| [CHANGELOG.md](docs/CHANGELOG.md) | Detailed version changelog |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Development guidelines |
| [RUNBOOK.md](docs/RUNBOOK.md) | Operations guide and troubleshooting |
| [SECURITY.md](docs/SECURITY.md) | Security architecture and recommendations |
| [AUDIT-REPORT.md](docs/AUDIT-REPORT.md) | Full codebase audit results |
| [DEAD-CODE-TRIAGE.md](docs/DEAD-CODE-TRIAGE.md) | Dead code analysis |
| [docs/adr/](docs/adr/) | Architecture Decision Records |

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## License

MIT License
