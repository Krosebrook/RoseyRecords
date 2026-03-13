# HarmoniQ Security Documentation

**Last Updated:** 2026-03-13
**Audit Date:** 2026-03-13

## Security Architecture

### Authentication
- **Provider:** Replit Auth via OpenID Connect
- **Library:** `openid-client` + Passport.js
- **Session Store:** PostgreSQL (`connect-pg-simple`)
- **Session TTL:** 7 days
- **Cookie Flags:** `httpOnly: true`, `secure: true`
- **Trust Proxy:** Enabled (`app.set('trust proxy', 1)`)

### Authorization
- Route-level: `isAuthenticated` middleware checks `req.user` exists
- Resource-level: Song/playlist CRUD verifies `userId` matches `req.user.claims.sub`
- Admin: `ADMIN_USER_IDS` env var grants unlimited Suno credits (does not bypass rate limits)

### Input Validation
- **Zod schemas** (`drizzle-zod`): Validate request bodies before database writes
- **`parseNumericId`**: Validates and parses route `:id` parameters
- **`sanitizeLog`**: Redacts sensitive data (passwords, tokens, emails, PII) from logs

### Rate Limiting

| Limiter | Window | Max | Scope |
|---|---|---|---|
| `aiRateLimiter` | 15 minutes | 50 requests | AI generation endpoints |
| `writeRateLimiter` | 15 minutes | 100 requests | Database write endpoints |

Implementation: Custom in-memory `RateLimiter` class with per-user/IP tracking.
Limitation: Not distributed — resets on server restart.

### Security Headers
Set in `server/index.ts`:
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- Note: `X-Frame-Options` is intentionally omitted to allow Replit iframe previews
- No Content-Security-Policy header configured

## Known Vulnerabilities

### npm Audit Results (2026-03-13)

4 vulnerabilities (1 low, 3 high):

| Package | Severity | Type | Notes |
|---|---|---|---|
| `minimatch` | High | ReDoS via wildcards, GLOBSTAR backtracking, nested extglobs | Transitive dep |
| `multer` | High | DoS via resource exhaustion, incomplete cleanup, uncontrolled recursion | Production dep (reference audio upload) |
| `rollup` | High | Arbitrary file write via path traversal | Transitive dep of Vite (devDep) |
| `qs` | Low | arrayLimit bypass in comma parsing (DoS) | Transitive dep |

All fixable via `npm audit fix`.

### Code Quality Issues Impacting Security

| Issue | Count | Risk |
|---|---|---|
| `@ts-nocheck` directives | 10 files | Type errors silenced, potential runtime crashes |
| `any` type usage | 55+ instances | Bypasses type safety, may hide data handling bugs |
| `@ts-ignore` | 1 instance | Single suppression in Landing.tsx |

### Critical Files with `@ts-nocheck`

These files have TypeScript checking completely disabled:
- `server/routes.ts` (1183 lines — all API logic)
- `server/storage.ts` (all database operations)
- `server/db.ts`
- `server/vite.ts`
- `server/replit_integrations/audio/client.ts`
- `server/replit_integrations/audio/routes.ts`
- `server/replit_integrations/batch/utils.ts`
- `server/replit_integrations/chat/routes.ts`
- `server/replit_integrations/image/client.ts`
- `server/replit_integrations/image/routes.ts`

## Data Protection

### Sensitive Data Handling
- API keys: Stored in environment variables, never logged or sent to client
- User sessions: Stored as JSONB in PostgreSQL (not encrypted at rest)
- Passwords: Not applicable (Replit Auth handles credentials)
- PII: Email, name, avatar stored in `users` table

### Data Flow Security
- All AI API calls made server-side (keys never exposed to client)
- Audio URLs are external (Suno CDN, Replicate CDN) — not stored locally
- No file upload to local filesystem (audio generated externally)

## Recommendations (Priority Order)

### P1 - Critical
1. Remove `@ts-nocheck` from `routes.ts` and `storage.ts` — these contain all business logic
2. Add CSRF protection (currently no CSRF tokens on state-changing requests)
3. Add request body size limits (Express default is 100kb but not explicitly set)

### P2 - High
4. Run `npm audit fix` to resolve all 4 known vulnerabilities (minimatch, multer, rollup, qs)
5. Add structured logging with security event tracking
6. Implement API key rotation strategy
7. Add `/health` endpoint that doesn't expose internals

### P3 - Medium
8. Add Content-Security-Policy header with strict directives
9. Migrate rate limiting to Redis for persistence across restarts
10. Add database connection encryption verification
11. Implement user data export/deletion (GDPR compliance)

### P4 - Low
12. Add Subresource Integrity (SRI) for CDN resources
13. Implement API versioning for backward-compatible changes
14. Add automated security scanning to CI pipeline
