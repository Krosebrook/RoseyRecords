# ADR-001: Replit Auth via OpenID Connect

**Status:** Accepted
**Date:** 2026-01-23
**Context:** Authentication provider selection for HarmoniQ

## Decision

Use Replit Auth via OpenID Connect (OIDC) as the sole authentication provider.

## Context

HarmoniQ is deployed exclusively on Replit. We needed an authentication solution that:
- Works seamlessly in the Replit environment
- Requires no additional service setup
- Provides user identity (email, name, avatar)
- Supports session-based auth for a traditional web app

## Consequences

**Positive:**
- Zero-config authentication — Replit manages the OIDC provider
- Automatic user creation on first login (upsert pattern)
- Session persistence via PostgreSQL (`connect-pg-simple`)
- Secure by default: httpOnly cookies, secure flag, 7-day TTL

**Negative:**
- Platform lock-in: only Replit users can authenticate
- No social login options (Google, GitHub, etc.)
- Migration to another auth provider would require significant refactoring

**Risks:**
- If Replit changes its OIDC implementation, auth may break
- No MFA or advanced security features beyond what Replit provides

## Alternatives Considered

1. **Auth0 / Clerk** — More features but adds external dependency and cost
2. **Passport Local** — Simple but requires password management
3. **Firebase Auth** — Good social logins but adds Google dependency
