# Contributing to HarmoniQ

Thank you for your interest in contributing to HarmoniQ! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database access
- API keys for AI services (for full functionality)

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   Copy `.env.example` to `.env` and fill in your values. At minimum you need:
   - `DATABASE_URL` — PostgreSQL connection string
   - `SESSION_SECRET` — any random string
   - `ISSUER_URL` and `REPL_ID` — provided by Replit
   - `AI_INTEGRATIONS_OPENAI_*` and `AI_INTEGRATIONS_GEMINI_*` — via Replit integrations

3. **Initialize Database**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:5000`.

## Project Structure

```
/
├── client/src/
│   ├── components/     # Shared + shadcn/ui components
│   ├── hooks/          # Custom React hooks (auth, songs, playlists, etc.)
│   ├── lib/            # Utilities (queryClient, storage, utils)
│   └── pages/          # 16 route pages (all lazy-loaded)
├── server/
│   ├── routes.ts       # API route handlers
│   ├── storage.ts      # IStorage interface + DatabaseStorage
│   ├── services/       # AI service clients (suno, gemini, replicate, etc.)
│   └── replit_integrations/  # Auth, chat, image, audio, batch
├── shared/
│   ├── schema.ts       # Drizzle tables, Zod schemas, TypeScript types
│   ├── routes.ts       # API path + method contracts
│   └── models/         # auth.ts (users/sessions), chat.ts (conversations/messages)
└── docs/               # Documentation
```

## Code Conventions

### TypeScript
- Use TypeScript for all new code
- Define data models in `shared/schema.ts` or `shared/models/`
- Use Zod for runtime validation (`createInsertSchema` from `drizzle-zod`)
- Avoid `any` — use Drizzle's inferred types instead
- Never add `@ts-nocheck` to new files

### React Components
- Functional components with hooks only
- Use shadcn/ui components from `@/components/ui/`
- Add `data-testid` attributes to interactive elements and key display elements
- Use `React.lazy()` for new pages (register in `App.tsx`)

### Styling
- Tailwind CSS utility classes (custom synthwave theme)
- Follow CSS variables in `client/src/index.css`
- Responsive breakpoints: `sm:`, `md:`, `lg:`
- No inline styles unless absolutely necessary

### API Routes
- Keep route handlers thin — business logic goes in storage layer
- Validate input with Zod schemas before passing to storage
- Use `parseNumericId()` for route `:id` parameters
- Return consistent JSON responses
- Use proper HTTP status codes (200, 201, 400, 401, 404, 500)

### State Management
- TanStack React Query for server state (use `queryKey` arrays for cache segments)
- `apiRequest()` from `@/lib/queryClient` for POST/PATCH/DELETE
- Always invalidate cache by `queryKey` after mutations
- `localStorage` via `client/src/lib/storage.ts` for client-side persistence

## Making Changes

### Branch Naming
- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation updates

### Commit Messages
Follow conventional commits:
```
feat: add audio visualizer
fix: handle empty audio sources
docs: update API documentation
refactor: simplify storage interface
```

### Adding a New Page

1. Create component in `client/src/pages/NewPage.tsx`
2. Add lazy import and route in `client/src/App.tsx`
3. Wrap with `ProtectedRoute` if authentication is required
4. Add sidebar navigation item in `Layout.tsx` if needed
5. Add `data-testid` attributes to interactive elements

### Adding a New API Endpoint

1. Define request/response types in `shared/schema.ts`
2. Add storage method to `IStorage` interface
3. Implement in `DatabaseStorage` class
4. Create route handler in `server/routes.ts`
5. Apply appropriate rate limiter (`aiRateLimiter` or `writeRateLimiter`)

### Adding a New AI Integration

1. Create service module in `server/services/newService.ts`
2. Add API key env var to `.env.example`
3. Add route handlers with `aiRateLimiter`
4. Add frontend UI (form, results display, loading states)
5. Update `docs/ARCHITECTURE.md` and `replit.md`

## Database Changes

1. Modify table definitions in `shared/schema.ts` or `shared/models/*.ts`
2. Run `npm run db:push` to apply changes
3. Update `IStorage` interface and `DatabaseStorage` if needed
4. Never change primary key column types
5. Add new columns with defaults or make them nullable

## Testing

### Test IDs
Add `data-testid` to elements for automated testing:
```tsx
<Button data-testid="button-submit">Submit</Button>
<input data-testid="input-email" />
<span data-testid="text-song-title-${id}">{title}</span>
```

### Running Tests
```bash
# Existing unit tests (tsx-based, no test runner configured)
npx tsx server/utils.test.ts
npx tsx client/src/lib/queryClient.test.ts
```

Note: No test runner (vitest/jest) is currently configured. Tests are standalone TypeScript files.

## Documentation

Update documentation when:
- Adding new features → `CHANGELOG.md`, `replit.md`
- Changing API endpoints → `docs/API.md`
- Modifying architecture → `docs/ARCHITECTURE.md`
- Adding environment variables → `.env.example`, `docs/RUNBOOK.md`
- Making architectural decisions → new ADR in `docs/adr/`

## Questions?

1. Check existing documentation in `docs/`
2. Look at similar code patterns in the codebase
3. Review Architecture Decision Records in `docs/adr/`
4. Open an issue for discussion
