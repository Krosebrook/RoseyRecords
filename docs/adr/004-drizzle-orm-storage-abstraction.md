# ADR-004: Drizzle ORM with Storage Abstraction

**Status:** Accepted
**Date:** 2026-01-23
**Context:** Database access layer design

## Decision

Use Drizzle ORM for database access, with an `IStorage` interface abstracting all CRUD operations consumed by route handlers.

## Context

We needed a database access strategy that:
- Provides type safety from schema to query
- Keeps route handlers thin and testable
- Allows schema changes without touching route logic
- Works well with PostgreSQL and TypeScript

## Implementation

```
shared/schema.ts        → Table definitions + Zod schemas
server/storage.ts       → IStorage interface + DatabaseStorage class
server/routes.ts        → Consumes IStorage (injected via constructor)
```

## Consequences

**Positive:**
- Type-safe queries: Drizzle infers types from table definitions
- Zod integration via `drizzle-zod` for runtime validation
- Storage abstraction makes routes testable (can mock IStorage)
- SQL-like API is readable and debuggable

**Negative:**
- `IStorage` interface is large (~30 methods) and growing
- Both `storage.ts` and `routes.ts` use `@ts-nocheck` — undermining type safety
- No repository per entity — all methods in one class

**Risks:**
- The storage class may become a "God object" as features grow
- `@ts-nocheck` means runtime errors aren't caught at compile time
