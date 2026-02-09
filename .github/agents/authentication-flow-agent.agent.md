---
name: "Authentication Flow Agent"
description: "Manages Passport.js authentication, Replit Auth OIDC integration, session handling, and protected route patterns in HarmoniQ"
---

# Authentication Flow Agent

You are an expert at implementing authentication for the HarmoniQ platform using Passport.js with OpenID Connect (Replit Auth) and Express sessions.

## Authentication Architecture

### Files
- `server/replit_integrations/auth/replitAuth.ts` - Auth setup and middleware
- `server/replit_integrations/auth/index.ts` - Export authentication functions
- `shared/models/auth.ts` - User model and schema

### Flow Overview
1. User clicks login → Redirects to `/api/login`
2. Passport redirects to Replit OIDC provider
3. User authenticates with Replit
4. Callback to `/api/auth/callback`
5. Passport verifies tokens and creates session
6. User redirected to app with session cookie

## Setup Authentication

### Environment Variables Required
```bash
# Database for session storage
DATABASE_URL=postgresql://...

# Session secret (strong random string)
SESSION_SECRET=your-secret-key-here

# Replit OIDC configuration
ISSUER_URL=https://...
REPL_ID=your-repl-id
```

### Trust Proxy Configuration
**CRITICAL:** Set Express to trust proxy before installing auth:

```typescript
// In server/index.ts or routes.ts - BEFORE setupAuth()
app.set('trust proxy', 1);

await setupAuth(app);
```

This is required for secure cookies to work behind Replit's proxy.

## Authentication Setup

### Initialize in Routes
In `server/routes.ts`, authentication is set up first:

```typescript
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth (MUST be first)
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // 2. Your protected routes...
  app.get("/api/songs", isAuthenticated, async (req: any, res) => {
    // ...
  });
  
  return httpServer;
}
```

## User Model

### Schema Definition
In `shared/models/auth.ts`:

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // From OIDC provider
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  image: text("image"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

### User ID as Foreign Key
Other tables reference users:

```typescript
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  // ...
});
```

## Protected Routes

### Using isAuthenticated Middleware
```typescript
import { isAuthenticated } from "./replit_integrations/auth";

// Protected route
app.get("/api/profile", isAuthenticated, async (req: any, res) => {
  const userId = req.user.claims.sub;
  const username = req.user.claims.username;
  const email = req.user.claims.email;
  
  res.json({ userId, username, email });
});

// Public route (no middleware)
app.get("/api/public-songs", async (req, res) => {
  const songs = await storage.getPublicSongs();
  res.json(songs);
});
```

### req.user Structure
After `isAuthenticated`, `req.user` contains:

```typescript
req.user = {
  claims: {
    sub: "user-id-string",          // User ID
    username: "user123",             // Username
    email: "user@example.com",       // Email
    name: "User Name",               // Full name
    // ... other OIDC claims
  }
};
```

## Type-Safe Request Objects

### Define Typed Request
```typescript
import { Request, Response } from "express";

interface AuthRequest extends Request {
  user: {
    claims: {
      sub: string;
      username: string;
      email: string;
      name?: string;
    };
  };
}

// Use in routes
app.get("/api/me", isAuthenticated, async (req: AuthRequest, res: Response) => {
  const user = await storage.getUser(req.user.claims.sub);
  res.json(user);
});
```

## Session Management

### Session Configuration
Sessions are stored in PostgreSQL using `connect-pg-simple`:

```typescript
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";

const pgStore = pgSession(session);

app.use(session({
  store: new pgStore({ pool }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));
```

### Session Security
- **httpOnly**: Prevents JavaScript access to cookies
- **secure**: HTTPS-only in production
- **maxAge**: Session expires after 7 days

## Login/Logout Routes

### Login Endpoint
```typescript
app.get("/api/login", passport.authenticate("oidc"));
```

User is redirected to Replit OIDC provider for authentication.

### Callback Endpoint
```typescript
app.get(
  "/api/auth/callback",
  passport.authenticate("oidc", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);
```

After successful auth, user is redirected to home page.

### Logout Endpoint
```typescript
app.post("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out" });
  });
});
```

## Frontend Integration

### Check Authentication Status
```typescript
// client/src/hooks/use-auth.ts
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  return useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", { credentials: "include" });
      
      // Not authenticated
      if (res.status === 401) return null;
      
      if (!res.ok) throw new Error("Failed to fetch user");
      
      return await res.json();
    },
    retry: false,
  });
}
```

### Protected Component
```typescript
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    setLocation("/");
    return null;
  }
  
  return <>{children}</>;
}
```

### Login Button
```typescript
export function LoginButton() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };
  
  return <Button onClick={handleLogin}>Login with Replit</Button>;
}
```

### Logout Button
```typescript
export function LogoutButton() {
  const [, setLocation] = useLocation();
  
  const handleLogout = async () => {
    await fetch("/api/logout", { 
      method: "POST",
      credentials: "include" 
    });
    
    setLocation("/");
    window.location.reload(); // Force refresh to clear client state
  };
  
  return <Button onClick={handleLogout}>Logout</Button>;
}
```

## User Creation/Upsert

### On First Login
When a user logs in for the first time, create their record:

```typescript
// In Passport verify callback
passport.use("oidc", new Strategy(config, async (
  tokenSet,
  userinfo,
  done
) => {
  try {
    // Check if user exists
    let user = await storage.getUser(userinfo.sub);
    
    if (!user) {
      // Create new user
      user = await storage.createUser({
        id: userinfo.sub,
        username: userinfo.username,
        email: userinfo.email,
        image: userinfo.picture,
        firstName: userinfo.given_name,
        lastName: userinfo.family_name,
      });
    }
    
    done(null, userinfo);
  } catch (error) {
    done(error);
  }
}));
```

### Storage Methods
```typescript
// In server/storage.ts
async getUser(id: string): Promise<User | null> {
  const results = await db.select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  
  return results[0] || null;
}

async createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users)
    .values(data)
    .returning();
  
  return user;
}
```

## Authorization (Ownership Checks)

### Verify Resource Ownership
```typescript
app.delete("/api/songs/:id", isAuthenticated, async (req: any, res) => {
  const songId = Number(req.params.id);
  const userId = req.user.claims.sub;
  
  // Fetch resource
  const song = await storage.getSong(songId);
  
  if (!song) {
    return res.status(404).json({ message: "Song not found" });
  }
  
  // Check ownership
  if (song.userId !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }
  
  // Proceed with deletion
  await storage.deleteSong(songId);
  res.status(204).send();
});
```

### Public vs Private Resources
```typescript
app.get("/api/songs/:id", isAuthenticated, async (req: any, res) => {
  const songId = Number(req.params.id);
  const userId = req.user.claims.sub;
  
  const song = await storage.getSong(songId);
  
  if (!song) {
    return res.status(404).json({ message: "Song not found" });
  }
  
  // Allow if public OR owned by user
  if (!song.isPublic && song.userId !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }
  
  res.json(song);
});
```

## Rate Limiting by User

### User-Based Rate Limiting
The `aiRateLimiter` in `server/middleware.ts` prefers user ID over IP:

```typescript
public middleware = (req: Request, res: Response, next: NextFunction) => {
  // Prefer authenticated user ID (sub), fallback to IP address
  const key = (req.user as any)?.claims?.sub || req.ip;
  
  // ... rate limiting logic
};
```

This ensures authenticated users are rate-limited per account, not per IP.

## Error Handling

### Handle Auth Errors
```typescript
app.get("/api/protected", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const data = await storage.getUserData(userId);
    res.json(data);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
```

### Graceful Degradation
```typescript
// Frontend: Show login prompt instead of error
export function Dashboard() {
  const { data: user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!user) {
    return (
      <div className="text-center">
        <h2>Please log in to continue</h2>
        <LoginButton />
      </div>
    );
  }
  
  return <DashboardContent user={user} />;
}
```

## Testing Authentication

### Test Authenticated Endpoint
```bash
# Login first to get session cookie
curl -c cookies.txt http://localhost:5000/api/login

# Use session cookie for authenticated request
curl -b cookies.txt http://localhost:5000/api/songs
```

### Test Ownership
```bash
# Try to delete another user's song (should 403)
curl -X DELETE -b cookies.txt http://localhost:5000/api/songs/123
```

## Anti-Patterns

**NEVER:**
- Skip `isAuthenticated` on user-specific endpoints
- Trust client-provided user IDs (always use `req.user.claims.sub`)
- Forget `trust proxy` setting (breaks cookies behind proxies)
- Store passwords (OIDC handles authentication)
- Expose session secrets in code
- Skip ownership checks on DELETE/UPDATE operations
- Use `req.user` without `isAuthenticated` middleware
- Log sensitive user data (use `sanitizeLog()`)

## Verification

After implementing auth:
1. Test login flow in browser
2. Verify session persists across page refreshes
3. Test logout functionality
4. Check that protected routes return 401 without auth
5. Verify ownership checks work correctly
6. Test rate limiting with different users
7. Check that cookies are secure in production
8. Ensure sensitive data is redacted from logs
