# ADR-005: In-Memory Rate Limiting

**Status:** Accepted (with known limitations)
**Date:** 2026-01-25
**Context:** API abuse prevention

## Decision

Implement a custom in-memory `RateLimiter` class for per-user/IP rate limiting.

## Current Configuration

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| `aiRateLimiter` | 15 minutes | 50 | AI generation endpoints |
| `writeRateLimiter` | 15 minutes | 100 | Database write endpoints |

## Consequences

**Positive:**
- Zero external dependencies
- Sub-millisecond latency (Map lookup)
- Automatic cleanup via `setInterval`
- Per-user tracking when authenticated, per-IP fallback

**Negative:**
- Not distributed: resets on server restart or deploy
- Single-instance only: breaks with horizontal scaling
- Memory growth with many unique users (mitigated by cleanup)

**Future Consideration:**
- If the app scales to multiple instances, migrate to Redis-backed rate limiting
- Consider sliding window algorithm for smoother rate enforcement
