# HarmoniQ Database Documentation

**Last Updated:** 2026-03-13
**Engine:** PostgreSQL 16 (Replit-managed)
**ORM:** Drizzle ORM with drizzle-zod

## Connection

- **Driver:** `node-postgres` (`pg` package) via connection pool
- **Connection String:** `DATABASE_URL` environment variable
- **Pool Size:** Default (10 connections)
- **SSL:** Managed by Replit

## Schema Overview

8 tables across 3 schema files:

| File | Tables |
|---|---|
| `shared/models/auth.ts` | `users`, `sessions` |
| `shared/models/chat.ts` | `conversations`, `messages` |
| `shared/schema.ts` | `songs`, `playlists`, `playlist_songs`, `song_likes` |

## Table Definitions

### users

Managed by Replit Auth. Upserted on login.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | varchar | PK, default `gen_random_uuid()` | Set by Replit OIDC `sub` claim |
| `email` | varchar | UNIQUE, nullable | From OIDC claims |
| `first_name` | varchar | nullable | |
| `last_name` | varchar | nullable | |
| `profile_image_url` | varchar | nullable | |
| `created_at` | timestamp | default `now()` | |
| `updated_at` | timestamp | default `now()` | Updated on upsert |

### sessions

Managed by `connect-pg-simple`. Auto-created if missing.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `sid` | varchar | PK | Session ID |
| `sess` | jsonb | NOT NULL | Serialized session data |
| `expire` | timestamp | NOT NULL, indexed | Auto-cleanup by TTL |

Index: `IDX_session_expire` on `expire`

### songs

Core content entity.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `user_id` | varchar | NOT NULL, FK→users | |
| `title` | text | NOT NULL | |
| `lyrics` | text | NOT NULL | |
| `description` | text | nullable | |
| `genre` | text | nullable | |
| `mood` | text | nullable | |
| `creation_mode` | text | default "description" | "description", "lyrics", "image" |
| `has_vocal` | boolean | default true | |
| `vocal_gender` | text | nullable | "male" or "female" |
| `recording_type` | text | nullable | "studio", "live", etc. |
| `audio_url` | text | nullable | External URL to generated audio |
| `image_url` | text | nullable | Cover art URL |
| `is_public` | boolean | default false | Visibility toggle |
| `play_count` | integer | default 0 | Atomically incremented |
| `like_count` | integer | default 0 | Atomically incremented/decremented |
| `created_at` | timestamp | default `now()` | |

### playlists

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `user_id` | varchar | NOT NULL, FK→users | |
| `name` | text | NOT NULL | |
| `description` | text | nullable | |
| `image_url` | text | nullable | |
| `is_public` | boolean | default false | |
| `created_at` | timestamp | default `now()` | |

### playlist_songs

Junction table for playlists↔songs (many-to-many).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `playlist_id` | integer | NOT NULL, FK→playlists (CASCADE) | |
| `song_id` | integer | NOT NULL, FK→songs (CASCADE) | |
| `added_at` | timestamp | default `now()` | |

### song_likes

Tracks which users have liked which songs.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `user_id` | varchar | NOT NULL, FK→users | |
| `song_id` | integer | NOT NULL, FK→songs (CASCADE) | |
| `created_at` | timestamp | default `now()` | |

Note: No unique constraint on `(user_id, song_id)` — duplicate likes are prevented at the application level.

### conversations

AI chat sessions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `title` | text | NOT NULL | |
| `created_at` | timestamp | default `CURRENT_TIMESTAMP` | |

### messages

Chat messages within conversations.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | serial | PK | |
| `conversation_id` | integer | NOT NULL, FK→conversations (CASCADE) | |
| `role` | text | NOT NULL | "user" or "assistant" |
| `content` | text | NOT NULL | |
| `created_at` | timestamp | default `CURRENT_TIMESTAMP` | |

## Cascade Rules

| Parent | Child | On Delete |
|---|---|---|
| `playlists` | `playlist_songs` | CASCADE |
| `songs` | `playlist_songs` | CASCADE |
| `songs` | `song_likes` | CASCADE |
| `conversations` | `messages` | CASCADE |

Note: `users` does not cascade to `songs` — deleting a user leaves orphaned songs.

## Schema Management

### Commands

```bash
npm run db:push        # Apply schema changes (non-destructive)
npm run db:push --force  # Apply schema changes (may drop columns)
npx drizzle-kit studio  # Open Drizzle Studio GUI
```

### Migration Strategy

HarmoniQ uses Drizzle Kit's `push` command (schema-first, no migration files). This means:
- Schema changes are applied directly from TypeScript definitions
- No migration history is maintained
- Column drops require `--force` flag
- Primary key type changes are **never safe** — they must be avoided

### Adding a New Table

1. Define the table in the appropriate schema file
2. Create insert schema with `createInsertSchema(table).omit({ id: true, createdAt: true })`
3. Export inferred types: `InsertX`, `X` (select type)
4. Add CRUD methods to `IStorage` interface
5. Implement in `DatabaseStorage` class
6. Run `npm run db:push`

## Performance Considerations

### Current Indexes
- `users.id` (PK)
- `sessions.sid` (PK)
- `sessions.expire` (explicit index)
- All serial PKs have implicit indexes
- `users.email` (unique constraint = implicit index)

### Missing Indexes (Recommended)
- `songs.user_id` — queries filter by user frequently
- `songs.is_public` — Explore page filters public songs
- `song_likes(user_id, song_id)` — unique constraint but explicit composite index would help
- `playlist_songs.playlist_id` — playlist content lookups
- `messages.conversation_id` — chat message retrieval

### Atomic Operations

Play counts and like counts use SQL-level atomic operations:
```sql
-- Increment play count (prevents race conditions)
UPDATE songs SET play_count = COALESCE(play_count, 0) + 1 WHERE id = $1
```
