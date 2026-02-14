## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-12 - N+1 Query Optimization with Drizzle InnerJoin
**Learning:** Fetching related items using `inArray` (IDs -> Fetch Items) results in multiple queries and requires manual in-memory sorting.
**Action:** Use `innerJoin` with `orderBy` on the join table's timestamp (e.g., `playlistSongs.addedAt`) to fetch and sort related items in a single query.

## 2026-02-12 - Drizzle .nullsLast() Type Error
**Learning:** The `.nullsLast()` method on `desc()` sorting causes type errors in the current environment configuration.
**Action:** Avoid `.nullsLast()` on `desc()` operations to maintain type safety.
