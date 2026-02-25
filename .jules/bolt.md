## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-12 - Drizzle ORM N+1 and Type Issues
**Learning:** Fetching items by ID list (N+1) is inefficient; replace with `innerJoin` and `orderBy` on the join table. Also, `.nullsLast()` on `desc()` sort operations causes type errors in Drizzle 0.39.3; rely on default sorting for non-nullable columns.
**Action:** Use `db.select(getTableColumns(T)).from(T).innerJoin(...)` for related data fetching.
