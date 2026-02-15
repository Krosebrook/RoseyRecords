## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-03-01 - Join Optimization
**Learning:** Fetching related items (like songs in a playlist) by first fetching IDs and then fetching items (N+1-ish) is inefficient and complex to sort manually.
**Action:** Use `innerJoin` with `orderBy` on the join table to fetch related items in a single query with correct ordering, reducing round trips and code complexity.

## 2026-03-01 - Drizzle nullsLast
**Learning:** The `.nullsLast()` method on `desc()` may not be available or cause type errors in some Drizzle versions/configurations.
**Action:** Remove `.nullsLast()` if the column is effectively non-nullable (e.g., `defaultNow()`), or use `sql` operator if strictly needed.
