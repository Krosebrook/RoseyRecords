# Quick Start: Phase 1 Critical Fixes

**Goal:** Make HarmoniQ safe for internal alpha testing  
**Timeline:** 1 week (48 hours)  
**Outcome:** Score improves from 25/50 to 32/50 (Dev Preview)

---

## WHY THESE FIXES?

These 5 fixes eliminate the **highest risk, lowest effort** problems:

1. **Backups (4h)** → Prevents catastrophic data loss
2. **Error Tracking (2h)** → Visibility into production issues
3. **Health Checks (2h)** → Can verify system is operational
4. **CORS (2h)** → Prevents cross-origin attacks
5. **Tests (28h)** → Confidence that critical paths work

**Total: 38 hours of the 48-hour Phase 1**

---

## SETUP CHECKLIST

### Prerequisites

- [ ] PostgreSQL database access
- [ ] Deployment platform access (Replit)
- [ ] GitHub repository write access
- [ ] Ability to install npm packages

---

## FIX 1: AUTOMATED BACKUPS (4 hours)

### For Replit PostgreSQL

```bash
# Replit automatically backs up managed PostgreSQL databases
# Verify backups are enabled in your Replit database settings
```

### Manual Backup Script (if needed)

```bash
# Create backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"
pg_dump $DATABASE_URL > /backups/$BACKUP_FILE
gzip /backups/$BACKUP_FILE
echo "Backup created: ${BACKUP_FILE}.gz"

# Delete backups older than 30 days
find /backups -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x scripts/backup.sh
```

### Test Backup Restoration

```bash
# Create test backup
pg_dump $DATABASE_URL > test_backup.sql

# Restore to test database
psql $TEST_DATABASE_URL < test_backup.sql

# Verify data restored correctly
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM songs;"
```

### ✅ Success Criteria
- [ ] Backups run daily automatically
- [ ] Can restore from backup successfully
- [ ] Backups retained for 30 days
- [ ] Backup monitoring alerts configured

---

## FIX 2: ERROR TRACKING (2 hours)

### Install Sentry

```bash
npm install @sentry/node @sentry/profiling-node
```

### Configure Sentry

```typescript
// server/index.ts - Add at the very top
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry BEFORE any other imports
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions
    // Set sampling rate for profiling
    profilesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}

// ... rest of imports
```

### Add Error Handler

```typescript
// server/index.ts - Update error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log to Sentry in production
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(err, {
      user: req.user ? { id: (req.user as any).claims?.sub } : undefined,
      tags: {
        path: req.path,
        method: req.method,
      },
    });
  }

  console.error("Internal Server Error:", sanitizeLog(err));

  if (res.headersSent) {
    return next(err);
  }

  // Send generic error in production, detailed in dev
  const response = process.env.NODE_ENV === "production"
    ? { message: "An error occurred" }
    : { message, stack: err.stack };

  return res.status(status).json(response);
});
```

### Add to Environment Variables

```bash
# .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Test Error Tracking

```typescript
// Add test endpoint (remove after testing)
app.get("/api/test-error", (req, res) => {
  throw new Error("Test error for Sentry");
});
```

```bash
# Test
curl https://your-app.repl.co/api/test-error

# Check Sentry dashboard - error should appear
```

### ✅ Success Criteria
- [ ] Sentry installed and configured
- [ ] Test error appears in Sentry dashboard
- [ ] Slack alerts configured for P0 errors
- [ ] Can view error stack traces in Sentry

---

## FIX 3: HEALTH CHECK ENDPOINTS (2 hours)

### Add Health Check Routes

```typescript
// server/routes.ts - Add before other routes
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/ready", async (_req, res) => {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
      },
    });
  } catch (error) {
    console.error("Readiness check failed:", error);
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      checks: {
        database: "failed",
      },
    });
  }
});
```

### Test Health Checks

```bash
# Test health endpoint
curl https://your-app.repl.co/health

# Expected: {"status":"ok","timestamp":"...","uptime":123}

# Test ready endpoint
curl https://your-app.repl.co/ready

# Expected: {"status":"ready","timestamp":"...","checks":{"database":"ok"}}
```

### ✅ Success Criteria
- [ ] /health returns 200 OK
- [ ] /ready returns 200 OK when DB connected
- [ ] /ready returns 503 when DB unavailable
- [ ] Documented in API.md

---

## FIX 4: CORS CONFIGURATION (2 hours)

### Install CORS Package

```bash
npm install cors
npm install --save-dev @types/cors
```

### Configure CORS

```typescript
// server/index.ts - Add after express.json()
import cors from "cors";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://your-app.repl.co',
  'https://your-production-domain.com',
];

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5000');
  allowedOrigins.push('http://localhost:5173'); // Vite dev server
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
}));
```

### Add to Environment Variables

```bash
# .env
ALLOWED_ORIGINS=https://your-app.repl.co,https://your-production-domain.com
```

### Test CORS

```bash
# Test from allowed origin (should succeed)
curl -H "Origin: https://your-app.repl.co" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-app.repl.co/api/songs

# Test from blocked origin (should fail)
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-app.repl.co/api/songs
```

### ✅ Success Criteria
- [ ] CORS installed and configured
- [ ] Allowed origins in environment variable
- [ ] Credentials: true set
- [ ] Unauthorized origins blocked

---

## FIX 5: BASIC TEST SUITE (28 hours)

### 5a. Install Vitest (4 hours)

```bash
# Install testing packages
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom happy-dom
```

### Create Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
```

### Create Test Setup

```typescript
// test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### Add Test Script

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Verify Setup

```bash
npm test
# Should show "No test files found"
```

### ✅ Success Criteria
- [ ] Vitest installed
- [ ] Config created
- [ ] npm test runs
- [ ] No errors

---

### 5b. Authentication Tests (8 hours)

```typescript
// server/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupAuth, isAuthenticated } from './replit_integrations/auth';

describe('Authentication', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await setupAuth(app);
    
    // Test route
    app.get('/api/protected', isAuthenticated, (req, res) => {
      res.json({ message: 'success', userId: (req.user as any).claims.sub });
    });
  });

  it('should redirect unauthenticated requests to login', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
  });

  it('should allow authenticated requests', async () => {
    // This test requires mocking Replit Auth - see test implementation
    // For now, mark as TODO
    expect(true).toBe(true);
  });

  it('should refresh expired tokens', async () => {
    // TODO: Implement token refresh test
    expect(true).toBe(true);
  });
});
```

### ✅ Success Criteria
- [ ] Auth tests written
- [ ] Tests run successfully
- [ ] >80% coverage on auth module

---

### 5c. API Endpoint Tests (16 hours)

```typescript
// server/routes.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storage } from './storage';

describe('Songs API', () => {
  const testUserId = 'test-user-123';
  let testSongId: number;

  beforeEach(async () => {
    // Create test song
    const song = await storage.createSong({
      userId: testUserId,
      title: 'Test Song',
      lyrics: 'Test lyrics',
      genre: 'Pop',
      mood: 'Happy',
      isPublic: false,
    });
    testSongId = song.id;
  });

  afterEach(async () => {
    // Cleanup
    await storage.deleteSong(testSongId, testUserId);
  });

  it('should get user songs', async () => {
    const songs = await storage.getUserSongs(testUserId);
    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe('Test Song');
  });

  it('should create new song', async () => {
    const song = await storage.createSong({
      userId: testUserId,
      title: 'New Song',
      lyrics: 'New lyrics',
      genre: 'Rock',
      mood: 'Energetic',
      isPublic: false,
    });
    
    expect(song.id).toBeDefined();
    expect(song.title).toBe('New Song');
    
    // Cleanup
    await storage.deleteSong(song.id, testUserId);
  });

  it('should update song', async () => {
    await storage.updateSong(testSongId, testUserId, {
      title: 'Updated Title',
    });
    
    const song = await storage.getSong(testSongId);
    expect(song?.title).toBe('Updated Title');
  });

  it('should delete song', async () => {
    await storage.deleteSong(testSongId, testUserId);
    
    const song = await storage.getSong(testSongId);
    expect(song).toBeNull();
  });

  it('should prevent unauthorized access', async () => {
    const otherUserId = 'other-user-456';
    
    // Should throw or return error when wrong user tries to delete
    await expect(
      storage.deleteSong(testSongId, otherUserId)
    ).rejects.toThrow();
  });

  it('should like/unlike song', async () => {
    await storage.likeSong(testSongId, testUserId);
    
    const song = await storage.getSong(testSongId);
    expect(song?.likeCount).toBe(1);
    
    await storage.unlikeSong(testSongId, testUserId);
    const updatedSong = await storage.getSong(testSongId);
    expect(updatedSong?.likeCount).toBe(0);
  });
});

describe('Playlists API', () => {
  // Similar tests for playlists
  it('should create playlist', async () => {
    // TODO
    expect(true).toBe(true);
  });

  it('should add songs to playlist', async () => {
    // TODO
    expect(true).toBe(true);
  });
});
```

### Run Tests

```bash
npm test
```

### ✅ Success Criteria
- [ ] API tests written for songs CRUD
- [ ] API tests written for playlists
- [ ] All tests pass
- [ ] >60% coverage on routes

---

## VERIFICATION CHECKLIST

After completing all fixes, verify:

### Backups
- [ ] `npm run db:backup` creates backup file
- [ ] Can restore from backup successfully
- [ ] Backups run automatically daily

### Error Tracking
- [ ] Trigger test error → appears in Sentry
- [ ] Sentry alerts configured
- [ ] Can view stack traces

### Health Checks
- [ ] `curl /health` returns 200
- [ ] `curl /ready` returns 200 when DB up
- [ ] `curl /ready` returns 503 when DB down

### CORS
- [ ] Allowed origin can access API
- [ ] Unauthorized origin blocked
- [ ] Credentials work correctly

### Tests
- [ ] `npm test` runs all tests
- [ ] All tests pass
- [ ] Coverage >60% overall

---

## DEPLOYMENT

After all fixes:

```bash
# 1. Run tests
npm test

# 2. Type check
npm run check

# 3. Build
npm run build

# 4. Deploy
# (Follow your deployment process)

# 5. Smoke test production
curl https://your-app.repl.co/health
curl https://your-app.repl.co/ready
```

---

## WHAT'S NEXT?

After Phase 1 is complete:

1. **Re-audit** - Score should be ~32/50 (Dev Preview)
2. **Start Phase 2** - CI/CD, staging environment, compliance
3. **Document learnings** - Update RUNBOOK.md with any issues encountered

---

## NEED HELP?

**Issues to watch for:**

1. **Backup storage full** - Configure retention policy (30 days)
2. **Sentry quota exceeded** - Use sampling (10% of errors)
3. **Tests fail** - Check database connection in tests
4. **CORS still blocked** - Check ALLOWED_ORIGINS env var

**Resources:**
- Sentry Docs: https://docs.sentry.io/platforms/node/
- Vitest Docs: https://vitest.dev/
- CORS Docs: https://github.com/expressjs/cors

---

**Last Updated:** February 18, 2026  
**Estimated Time:** 48 hours (1 week)  
**Outcome:** Safe for internal alpha testing
