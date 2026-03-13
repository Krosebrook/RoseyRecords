# HarmoniQ Codebase Audit Report

**Audit Date:** 2026-03-13
**Auditor:** Automated codebase analysis
**Scope:** Full codebase — frontend, backend, shared, configuration, dependencies

## Executive Summary

HarmoniQ is a functional AI music generation platform with a solid feature set. The codebase shows rapid feature development with accumulated technical debt, particularly around type safety and test coverage. The application is suitable for demonstration and limited beta use, but requires quality improvements before production deployment.

**Overall Score:** 6/10 (Functional but needs hardening)

## Audit Categories

### 1. Architecture (7/10)

**Strengths:**
- Clean separation: client/server/shared monorepo structure
- Storage abstraction (`IStorage` interface) decouples routes from database
- Service layer pattern for AI providers
- Shared type contracts between frontend and backend

**Weaknesses:**
- `routes.ts` is 1183 lines — single file handles all API logic
- `storage.ts` is a monolithic class with ~30 methods
- No middleware separation (auth, validation, error handling mixed in routes)
- Audio integration module defined but not mounted (dead code); chat and image routes are mounted

**Recommendations:**
- Split `routes.ts` into domain-specific route modules (songs, playlists, generation, theory)
- Extract validation middleware from route handlers
- Remove or complete unmounted integration modules

### 2. Type Safety (3/10)

**Strengths:**
- Drizzle ORM provides compile-time type safety for schema
- Zod schemas for runtime validation on insert operations
- Shared types used across frontend and backend

**Weaknesses:**
- 10 files use `@ts-nocheck` — disabling all TypeScript checking
- 55+ explicit `any` type usages (38 in routes.ts alone)
- 1 `@ts-ignore` in production code
- Core business logic files (`routes.ts`, `storage.ts`) have zero type checking

**Impact:** Runtime type errors are not caught during development. Any refactoring is high-risk.

**Recommendations:**
- Remove `@ts-nocheck` one file at a time, starting with `storage.ts`
- Replace `any` with proper types (use Drizzle's inferred types)
- Enable strict TypeScript config for new files

### 3. Test Coverage (2/10)

**Strengths:**
- `server/utils.test.ts` covers sanitization utilities
- `client/src/lib/queryClient.test.ts` covers API client

**Weaknesses:**
- Only 2 test files in the entire project
- No tests for routes, storage, services, or AI integrations
- No integration tests
- No E2E tests in the repository
- No CI pipeline running tests

**Recommendations:**
- Add unit tests for `DatabaseStorage` methods
- Add route integration tests with supertest
- Set up E2E testing with Playwright
- Establish minimum coverage requirements

#### E2E Test Results (2026-03-13 audit session)

Ad-hoc E2E tests executed during audit via Replit's Playwright testing tool (not a persistent test suite in the repo). These are one-time verification results, not repeatable CI tests.

| Test Suite | Tests | Pass | Fail | Notes |
|---|---|---|---|---|
| Landing page | 3 | 3 | 0 | Hero renders, nav links, CTA button |
| Explore page | 2 | 2 | 0 | Grid renders, song cards visible |
| Protected routes (unauthenticated) | 3 | 3 | 0 | Redirects to login for /library, /studio, /playlists |
| Music Studio tabs | 4 | 4 | 0 | Audio, Vocal, Suno, Theory tabs load |
| Music Theory tools | 3 | 3 | 0 | Chord/scale/tips forms render |
| Error states | 4 | 4 | 0 | Empty inputs rejected, invalid data handled |
| **Total** | **19** | **19** | **0** | All passing |

Note: No Playwright config or test suite exists in the repository. These tests were run via Replit's built-in testing tool (Chromium headless, against `http://localhost:5000`). Establishing a persistent E2E test suite is a recommended action item.

### 4. Security (6/10)

**Strengths:**
- OIDC authentication via established provider
- Session cookies with httpOnly + secure flags
- Zod input validation on database writes
- Log sanitization for sensitive data
- Rate limiting on AI and write endpoints
- Security headers (X-Content-Type-Options, X-XSS-Protection); X-Frame-Options intentionally omitted for Replit iframe

**Weaknesses:**
- No CSRF protection
- Rate limiter is in-memory (resets on restart)
- `@ts-nocheck` on security-critical code paths
- 4 npm audit vulnerabilities (1 low, 3 high): multer, rollup, qs
- No request body size limits explicitly set
- No Content-Security-Policy header

See `docs/SECURITY.md` for detailed analysis and recommendations.

### 5. Performance (5/10)

**Strengths:**
- Code splitting with React.lazy (16 lazy-loaded pages)
- TanStack Query caching with staleTime configuration
- Atomic SQL operations for counters (no race conditions)
- OIDC config memoization (1-hour cache)

**Weaknesses:**
- No database indexes beyond PKs and unique constraints
- Missing indexes on `songs.user_id`, `songs.is_public`, `playlist_songs.playlist_id`
- Connection pool uses defaults (may be undersized)
- No CDN for audio files
- Service worker caching strategy is basic

**Recommendations:**
- Add indexes for frequent query patterns (see DATABASE.md)
- Configure connection pool size based on expected load
- Implement CDN for audio file delivery

### 6. Code Quality (5/10)

**Strengths:**
- Consistent project structure
- Modern tooling (Vite, Drizzle, TanStack Query)
- Shared type contracts
- Component library (shadcn/ui)

**Weaknesses:**
- Large monolithic files (routes.ts: 1183 lines, storage.ts: large)
- Inconsistent error handling across routes
- Dead code: unmounted audio integration module (`replit_integrations/audio/`); chat and image routes ARE mounted
- Coming Soon stubs (Marketplace, Mixer, VideoCreator, Activity) add surface area without value
- No linting configuration (ESLint/Prettier not configured)

**Recommendations:**
- Configure ESLint + Prettier with pre-commit hooks
- Factor large files into domain modules
- Remove or gate Coming Soon pages behind feature flags

### 7. Documentation (7/10 — post-audit)

**Status:** Comprehensive documentation suite generated as part of this audit.

**Documents:**
| Document | Purpose |
|---|---|
| `README.md` (root) | Project overview, setup, tech stack |
| `.env.example` | All 20 environment variables documented |
| `docs/ARCHITECTURE.md` | System architecture, schema, auth flow |
| `docs/API.md` | All API endpoints with request/response examples |
| `docs/adr/` | 5 Architecture Decision Records |
| `docs/PRD.md` | Product requirements and feature status |
| `docs/ROADMAP.md` | Version history and planned features |
| `docs/CHANGELOG.md` | Detailed version changelog |
| `docs/CONTRIBUTING.md` | Development guidelines |
| `docs/RUNBOOK.md` | Operations guide and troubleshooting |
| `docs/DATABASE.md` | Schema, indexes, migration strategy |
| `docs/SECURITY.md` | Security architecture and vulnerabilities |
| `docs/AUDIT-REPORT.md` | This report |
| `docs/DEAD-CODE-TRIAGE.md` | Dead code analysis (15 candidates) |

### 8. Dependencies (6/10)

**Strengths:**
- Modern, well-maintained core dependencies
- TypeScript throughout
- Replit integrations reduce external dependency management

**Weaknesses:**
- 4 npm audit vulnerabilities (1 low, 3 high): multer (DoS), rollup (path traversal), qs (DoS)
- `multer` used only for reference audio upload (`/api/audio/generate-with-reference`)
- Large dependency tree (common for Node.js but increases attack surface)

## Environment Variables Inventory

20 environment variables identified:

| Category | Variables | Status |
|---|---|---|
| Core (required) | `DATABASE_URL`, `SESSION_SECRET`, `ISSUER_URL`, `REPL_ID` | Set |
| AI - OpenAI | `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` | Set (Replit integration) |
| AI - Gemini | `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL` | Set (Replit integration) |
| AI - Replicate | `REPLICATE_API_KEY` | Set |
| AI - Stable Audio | `FAL_API_KEY`, `FAL_KEY` | Set (aliases) |
| AI - Suno | `DEFAPI_API_KEY`, `SUNO_API_KEY`, `SUNO_PROVIDER`, `KIE_API_KEY`, `KIE_BASE_URL` | Varies |
| Admin | `ADMIN_USER_IDS` | Optional |
| Server | `PORT`, `NODE_ENV` | Defaults available |

## Action Items (Priority Order)

### Immediate (This Sprint)
1. Remove `@ts-nocheck` from `storage.ts` and `routes.ts`
2. Add missing database indexes
3. Resolve npm audit vulnerabilities (4 total: multer, rollup, qs — all fixable via `npm audit fix`)

### Short-Term (Next 2 Sprints)
5. Split `routes.ts` into domain modules
6. Add unit tests for storage layer (target: 50% coverage)
7. Configure ESLint + Prettier
8. Add CSRF protection
9. Remove or feature-flag Coming Soon pages

### Medium-Term (Next Quarter)
10. Add integration tests for API routes
11. Set up CI pipeline with type checking + tests
12. Migrate rate limiting to Redis
13. Add structured logging
14. Complete Marketplace and Mixer features

---

## Documentation Drift Analysis

### Methodology

All endpoints, environment variables, and features were cross-referenced against source code. Routes verified by grepping `app.get/post/delete` in `server/routes.ts` (50 handlers) and `server/replit_integrations/*/routes.ts` (6 handlers). Auth verified via `isAuthenticated` middleware and `app.use()` path-level middleware. Env vars verified via `grep -roh "process\.env\.\w+"` across server code.

### Implemented but Previously Undocumented

| Item | Type | Location |
|---|---|---|
| `POST /api/generate/ai-suggest` | Endpoint | `server/routes.ts:353` |
| `GET /api/songs/liked` | Endpoint | `server/routes.ts:212` |
| `POST /api/suno/generate` | Endpoint | `server/routes.ts:911` |
| `POST /api/suno/generate/start` | Endpoint | `server/routes.ts:946` |
| `GET /api/suno/status/:taskId` | Endpoint | `server/routes.ts:981` |
| `POST /api/suno/lyrics` | Endpoint | `server/routes.ts:1005` |
| `GET /api/suno/user` | Endpoint | `server/routes.ts:1029` |
| `GET /api/suno/status` | Endpoint | `server/routes.ts:900` |
| `GET /api/ace-step/config` | Endpoint | `server/routes.ts:1068` |
| `POST /api/ace-step/generate` | Endpoint | `server/routes.ts:1077` |
| `GET /api/ace-step/status/:predictionId` | Endpoint | `server/routes.ts:1102` |
| `POST /api/audio/generate-with-reference` | Endpoint | `server/routes.ts:1138` |
| `POST /api/generate-image` | Endpoint | `replit_integrations/image/routes.ts:6` |
| Conversation endpoints (5) | Endpoints | `replit_integrations/chat/routes.ts` |
| `DEFAPI_BASE_URL` | Env var | `server/services/suno.ts:153` |
| `ADMIN_USER_IDS` | Env var | `server/routes.ts` |

### Previously Documented but Incorrect (all corrected)

| Item | Error | Correction |
|---|---|---|
| `POST /api/logout` | Wrong method | Actual: `GET /api/logout` |
| Chat/image endpoints | Listed as unauthenticated | Auth via `app.use()` middleware before route registration |
| ACE-Step params | Documented `prompt`/`instrumental` | Actual: `tags` (required), `lyrics`, `duration`, `seed` |
| ACE-Step config maxDuration | Documented `300` | Actual: `240` (from `MAX_DURATION` constant) |
| Reference audio response | Documented `{audioUrl, duration}` | Actual: `{predictionId, status}` (async) |
| Suno generate response | Documented sync `{audioUrl, title, lyrics}` | Actual: async `{id, status: "processing"}` (SunoGenerationResult) |
| Suno status response | Documented `{status, result: {...}}` | Actual: flat `{id, status, audioUrl, clips: [...]}` (SunoStatusResult) |
| Suno user response | Documented `{creditsLeft, provider}` | Actual: `{credits, userId, plan}` (SunoUserInfo) or admin `{credits: -1, plan: "admin", isAdmin: true}` |
| Image generation response | Documented `{imageUrl}` | Actual: `{url, b64_json}` from gpt-image-1 |
| Image generation params | Documented `{prompt, style}` | Actual: `{prompt, size}` (1024x1024/512x512/256x256) |
| npm vulnerabilities | Reported as 2 | Actual: 4 (1 low, 3 high) |
| `SUNOAPI_COOKIE` in .env.example | Listed as used | Not referenced in any server code (removed) |

---

## Dependency Inventory

### Production Dependencies (74 packages)

| Package | Version | Purpose |
|---|---|---|
| `@fal-ai/client` | ^1.7.2 | Stable Audio API client |
| `@google/genai` | ^1.38.0 | Gemini AI integration |
| `@hookform/resolvers` | ^3.10.0 | Form validation resolvers |
| `@radix-ui/*` (20 packages) | various | shadcn/ui component primitives |
| `@tanstack/react-query` | ^5.60.5 | Server state management |
| `class-variance-authority` | ^0.7.1 | Variant styling utility |
| `clsx` | ^2.1.1 | Class name utility |
| `cmdk` | ^1.1.1 | Command palette component |
| `connect-pg-simple` | ^10.0.0 | PostgreSQL session store |
| `date-fns` | ^3.6.0 | Date formatting |
| `drizzle-orm` | ^0.39.3 | Database ORM |
| `drizzle-zod` | ^0.7.1 | Drizzle-Zod schema bridge |
| `embla-carousel-react` | ^8.6.0 | Carousel component |
| `express` | ^5.0.1 | HTTP server framework |
| `express-session` | ^1.19.0 | Session middleware |
| `framer-motion` | ^11.18.2 | Animation library |
| `input-otp` | ^1.4.2 | OTP input component |
| `lucide-react` | ^0.453.0 | Icon library |
| `memoizee` | ^0.4.17 | Function memoization |
| `memorystore` | ^1.6.7 | In-memory session store (fallback) |
| `multer` | ^2.0.2 | File upload handling (reference audio) |
| `next-themes` | ^0.4.6 | Theme switching |
| `openai` | ^6.16.0 | OpenAI API client |
| `openid-client` | ^6.8.1 | OIDC authentication |
| `p-limit` | ^7.2.0 | Concurrency limiter |
| `p-retry` | ^7.1.1 | Retry with backoff |
| `passport` | ^0.7.0 | Authentication framework |
| `passport-local` | ^1.0.0 | Local strategy (unused — see below) |
| `pg` | ^8.16.3 | PostgreSQL client |
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `react-day-picker` | ^8.10.1 | Date picker component |
| `react-hook-form` | ^7.55.0 | Form state management |
| `react-icons` | ^5.4.0 | Icon library (company logos) |
| `react-resizable-panels` | ^2.1.7 | Resizable panel layout |
| `recharts` | ^2.15.2 | Chart components |
| `replicate` | ^1.4.0 | Replicate API client |
| `tailwind-merge` | ^2.6.0 | Tailwind class merging |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities |
| `tw-animate-css` | ^1.2.5 | CSS animation utilities |
| `vaul` | ^1.1.2 | Drawer component |
| `wouter` | ^3.3.5 | Client-side router |
| `ws` | ^8.18.0 | WebSocket client (unused in current routes) |
| `zod` | ^3.25.76 | Schema validation |
| `zod-validation-error` | ^3.5.4 | Zod error formatting |

### Dev Dependencies (23 packages)

| Package | Version | Purpose |
|---|---|---|
| `@replit/vite-plugin-*` (3) | various | Replit development tooling |
| `@tailwindcss/typography` | ^0.5.15 | Typography plugin |
| `@tailwindcss/vite` | ^4.1.18 | Tailwind Vite integration |
| `@types/*` (9) | various | TypeScript type definitions |
| `@vitejs/plugin-react` | ^4.7.0 | React Vite plugin |
| `autoprefixer` | ^10.4.20 | CSS vendor prefixing |
| `drizzle-kit` | ^0.31.8 | Database migration tooling |
| `esbuild` | ^0.25.0 | Production bundler |
| `postcss` | ^8.4.47 | CSS processing |
| `tailwindcss` | ^3.4.17 | CSS framework |
| `tsx` | ^4.21.0 | TypeScript execution |
| `typescript` | 5.6.3 | TypeScript compiler |
| `vite` | ^7.3.0 | Dev server and bundler |

### Potentially Unused Dependencies

| Package | Evidence | Recommendation |
|---|---|---|
| `passport-local` | No `LocalStrategy` usage found in server code; app uses OIDC only | Remove |
| `ws` | No WebSocket server or client usage in current route handlers | Remove unless planned for real-time features |
| `memorystore` | `connect-pg-simple` is used for sessions; memorystore appears unused | Remove |
| `next-themes` | App uses custom CSS variables for theming, not next-themes | Verify usage or remove |
| `@types/memoizee` | Listed in prod deps instead of devDeps | Move to devDependencies |
| `@types/multer` | Listed in prod deps instead of devDeps | Move to devDependencies |

### Vulnerability Audit (npm audit, 2026-03-13)

| Package | Severity | Advisory | Fix |
|---|---|---|---|
| `multer` | High (x2) | DoS via resource exhaustion; DoS via uncontrolled recursion | `npm audit fix` |
| `rollup` | High | Arbitrary file write via path traversal (in Vite devDep chain) | `npm audit fix` |
| `qs` | Low | arrayLimit bypass in comma parsing (DoS) | `npm audit fix` |

All 4 vulnerabilities are fixable via `npm audit fix`.
