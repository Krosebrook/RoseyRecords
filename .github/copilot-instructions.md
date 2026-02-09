# HarmoniQ Development Guidelines

## Project Overview

HarmoniQ is an AI-powered music and lyrics generation platform built with React, Express.js, PostgreSQL, and multiple AI services (OpenAI, Gemini, Replicate, fal.ai). Users can generate song lyrics, create AI music, mix audio tracks, and share their creations.

## Tech Stack

### Frontend
- **React 18** with TypeScript (strict mode)
- **Vite** for build and development
- **Tailwind CSS** with custom synthwave theme
- **shadcn/ui** (Radix UI components)
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js 5
- **TypeScript** (ES modules)
- **PostgreSQL** with Drizzle ORM
- **Passport.js** with OpenID Connect (Replit Auth)
- **Express sessions** stored in PostgreSQL

### AI Services
- **OpenAI** - Fast lyrics generation
- **Google Gemini** - Song concepts, music theory
- **Replicate** - MusicGen (audio), Bark (vocals)
- **fal.ai** - Stable Audio (extended duration)

## How to Build and Run

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Environment variables configured (see `.env` file)

### Development Commands
```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server (runs on port 5000)
npm run dev

# Type check
npm run check

# Build for production
npm run build

# Start production server
npm start
```

### Database Management
```bash
# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Code Style Rules

### TypeScript
- **Strict mode enabled** - No `any` types allowed
- Use `import type` for type-only imports
- Define interfaces for all props and function parameters
- Use Zod schemas for runtime validation
- Prefer `const` over `let`, avoid `var`

### File Naming
- React components: `PascalCase.tsx` (e.g., `SongCard.tsx`)
- Utilities/hooks: `kebab-case.ts` (e.g., `use-songs.ts`)
- Pages: `PascalCase.tsx` (e.g., `Dashboard.tsx`)
- Server files: `kebab-case.ts` (e.g., `routes.ts`)

### Import Aliases
```typescript
// Client code
import { Button } from "@/components/ui/button";
import { Song } from "@shared/schema";

// Server code
import { api } from "@shared/routes";
import { storage } from "./storage";
```

### Styling
- Use Tailwind utility classes (no inline styles)
- Follow synthwave theme: `bg-primary`, `text-accent`, etc.
- Responsive: Use `sm:`, `md:`, `lg:` prefixes
- Dark mode by default

### Comments
- Use simple descriptive comments
- **Do NOT** use branded prefixes (e.g., avoid "Tool:", "AI:")
- Document complex logic and non-obvious workarounds
- Add JSDoc comments for public APIs

## Architecture Overview

### Directory Structure
```
harmoniq/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route components
│   │   └── lib/            # Utilities
├── server/                 # Backend Express app
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database layer
│   ├── services/           # AI service integrations
│   └── replit_integrations/# Auth and integrations
├── shared/                 # Shared code
│   ├── schema.ts           # Database schema
│   └── routes.ts           # API contracts
└── migrations/             # Database migrations
```

### Data Flow
1. UI components use React Query hooks (`use-songs.ts`)
2. Hooks call API endpoints defined in `server/routes.ts`
3. Routes use `isAuthenticated` middleware for protection
4. Routes call storage layer methods (`server/storage.ts`)
5. Storage layer uses Drizzle ORM to query PostgreSQL

### Authentication Flow
1. User clicks login → Redirects to `/api/login`
2. Passport handles OIDC with Replit
3. Session stored in PostgreSQL
4. `req.user.claims.sub` contains user ID on protected routes

## Key Conventions

### API Patterns
- All protected routes use `isAuthenticated` middleware
- User ID comes from `req.user.claims.sub` (server-side session)
- Validate input with Zod schemas
- Return proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Use `sanitizeLog()` before logging sensitive data

### React Query Hooks
- Query keys match API paths: `["/api/songs"]`
- Use `credentials: "include"` on all fetch calls
- Invalidate queries after mutations
- Handle loading/error states in UI

### Database Operations
- Use Drizzle ORM (never raw SQL)
- Foreign keys: Use `onDelete: "cascade"` for cleanup
- Timestamps: Use `.defaultNow()` for `createdAt`
- Validate with Zod schemas before insertion

### AI Services
- Apply rate limiting: `aiRateLimiter.middleware`
- Use queue pattern for long operations (fal.ai, Replicate)
- Implement retry logic for transient failures
- Cache expensive AI calls when possible

### Error Handling
- Always wrap async handlers in try-catch
- Log errors with context (operation, user ID)
- Return user-friendly error messages (never expose stack traces)
- Use toast notifications for user feedback

### Security
- Never trust client-provided user IDs
- Validate all user input with Zod
- Check resource ownership before DELETE/UPDATE
- Use `sanitizeLog()` to redact sensitive fields (password, token, email, name)
- Rate limit expensive operations (AI generation)

## Testing Approach

### Current Testing
- Minimal test infrastructure (see `server/utils.test.ts`)
- Run tests: `tsx server/utils.test.ts`
- Test pattern: Console-based with assertions

### What to Test
- Utility functions and data transformations
- Input validation (Zod schemas)
- Business logic (ownership checks, calculations)
- API endpoint authentication/authorization

## Custom Agents

This repository includes specialized coding agents in `.github/agents/`:
- `frontend-component-builder.agent.md` - React components
- `api-endpoint-builder.agent.md` - Express routes
- `database-schema-agent.agent.md` - Drizzle ORM
- `ai-service-integration.agent.md` - AI integrations
- `type-safety-agent.agent.md` - TypeScript strict mode
- `authentication-flow-agent.agent.md` - Passport.js auth
- `react-query-hook-builder.agent.md` - TanStack Query
- `audio-processing-agent.agent.md` - Audio features
- `security-auditor.agent.md` - Security reviews
- `error-handling-agent.agent.md` - Error patterns
- `performance-optimizer.agent.md` - Performance
- `documentation-writer.agent.md` - Documentation
- `test-writer.agent.md` - Unit tests
- `music-domain-agent.agent.md` - Music-specific logic

Use the relevant agent for your task to follow established patterns.

## Common Pitfalls to Avoid

1. **Don't** skip `isAuthenticated` middleware on protected routes
2. **Don't** use `any` type (strict TypeScript is enforced)
3. **Don't** forget `credentials: "include"` in fetch calls
4. **Don't** trust client-provided user IDs
5. **Don't** skip error handling on async operations
6. **Don't** expose API keys in client code
7. **Don't** skip rate limiting on AI endpoints
8. **Don't** use Switch without Label (accessibility)
9. **Don't** log sensitive data without sanitization
10. **Don't** skip ownership checks on mutations

## Performance Considerations

- Lazy load route components with `React.lazy()`
- Memoize expensive computations with `useMemo`
- Use virtual scrolling for long lists
- Limit database query results (pagination)
- Cache AI responses for repeated inputs
- Optimize images (lazy loading, proper sizing)
- Debounce search and expensive operations

## Deployment

- Build target: `dist/` directory
- Entry point: `dist/index.cjs`
- Static assets: `dist/public/`
- Environment: Set `NODE_ENV=production`
- Database: Run `npm run db:push` before first deploy

## Getting Help

- Check existing documentation in `docs/` directory
- Review custom agents for specific task guidance
- Look at similar code in the codebase for patterns
- Check `docs/CONTRIBUTING.md` for development guidelines
