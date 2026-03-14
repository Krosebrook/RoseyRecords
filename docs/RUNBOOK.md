# HarmoniQ Operations Runbook

**Last Updated:** 2026-03-13

## Quick Reference

| Action | Command |
|---|---|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Start production | `node dist/index.cjs` |
| Push schema changes | `npm run db:push` |
| Open Drizzle Kit | `npx drizzle-kit studio` |

## Environment Variables

See `.env.example` for the complete list. Critical variables:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Cookie signing secret |
| `ISSUER_URL` | Yes | Replit OIDC issuer |
| `REPL_ID` | Yes | Replit project identifier |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | OpenAI for lyrics/suggestions |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Yes | Gemini for concepts/theory |
| `DEFAPI_API_KEY` | No | Suno music generation |
| `REPLICATE_API_KEY` | No | MusicGen/Bark/ACE-Step |
| `FAL_API_KEY` | No | Stable Audio |

## Common Operations

### Deploying

1. Push to main branch on Replit
2. Replit Autoscale deployment picks up changes automatically
3. Build runs `tsx script/build.ts` (esbuild bundles server + Vite builds client)
4. Output: `dist/index.cjs` (server) + `dist/public/` (static assets)
5. Production process starts: `node dist/index.cjs`

### Database Schema Changes

1. Modify table definitions in `shared/schema.ts` or `shared/models/*.ts`
2. Update `IStorage` interface and `DatabaseStorage` class if needed
3. Run `npm run db:push` to apply changes
4. If push fails with conflicts, use `npm run db:push --force` (destructive for dropped columns)
5. Never change primary key column types

### Adding a New AI Service

1. Create service module in `server/services/newService.ts`
2. Add API key env var to `.env.example`
3. Add route handlers in `server/routes.ts`
4. Add frontend UI in the appropriate page
5. Update rate limiter if the endpoint is AI-intensive

### Session Management

- Sessions stored in PostgreSQL `sessions` table
- TTL: 7 days (auto-expired by `connect-pg-simple`)
- Session secret: `SESSION_SECRET` env var
- To force-logout all users: `DELETE FROM sessions;`

## Troubleshooting

### App Won't Start

**Symptom:** Server crashes on startup
**Check:**
1. `DATABASE_URL` is set and PostgreSQL is reachable
2. `SESSION_SECRET`, `ISSUER_URL`, `REPL_ID` are set
3. `sessions` table exists: `SELECT * FROM sessions LIMIT 1;`
4. Node.js version is 20+ (`node --version`)

### Authentication Failures

**Symptom:** Users can't log in, 401 errors
**Check:**
1. `ISSUER_URL` points to correct Replit OIDC endpoint
2. `REPL_ID` matches the current Repl
3. Session cookie is being set (check browser DevTools → Application → Cookies)
4. `sessions` table is writable

### AI Generation Fails

**Symptom:** "Failed to generate" errors
**Check:**
1. Verify the relevant API key is set (check server logs for `[AI-KEY]` or key validation)
2. Check rate limits: each user gets 50 AI requests per 15 minutes
3. Check provider status:
   - OpenAI: https://status.openai.com
   - Replicate: https://status.replicate.com
   - fal.ai: https://status.fal.ai
4. Check server logs for specific error messages
5. Suno generation may take up to 5 minutes (polling-based)

### High Memory Usage

**Symptom:** Process using >512MB
**Check:**
1. Rate limiter maps may accumulate entries (cleaned every 60s)
2. Large audio responses being held in memory
3. Check for memory leaks: `process.memoryUsage()`
4. Restart the application to reset in-memory state

### Database Connection Issues

**Symptom:** "Connection refused" or "Too many connections"
**Check:**
1. PostgreSQL is running and `DATABASE_URL` is correct
2. Connection pool isn't exhausted (default: 10 connections)
3. Long-running queries: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
4. Kill stuck queries: `SELECT pg_terminate_backend(pid);`

## Monitoring

### Current State
- Console logging only (stdout)
- No structured logging
- No application metrics
- No alerting

### Recommended Improvements
1. Add structured JSON logging
2. Add `/health` endpoint for uptime monitoring
3. Track AI generation success/failure rates
4. Monitor database connection pool utilization
5. Set up error alerting (email or webhook)

## Incident Response

### Severity Levels

| Level | Definition | Response Time |
|---|---|---|
| P1 - Critical | App is down, data loss risk | Immediate |
| P2 - Major | Core feature broken (auth, generation) | 1 hour |
| P3 - Minor | Non-core feature broken, workaround exists | 4 hours |
| P4 - Low | Cosmetic issues, minor bugs | Next business day |

### P1 Response Steps

1. Check deployment logs for errors
2. Verify database connectivity
3. Check env vars are set correctly
4. If recent deploy caused the issue, roll back to previous checkpoint
5. If database is corrupted, restore from backup
