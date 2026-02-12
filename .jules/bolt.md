## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-12 - Optimized ID Fetching
**Learning:** Fetching full objects (with large text fields like `lyrics`) just to map to IDs is wasteful and increases DB/network load.
**Action:** Use specific Drizzle selectors (e.g., `db.select({ id: table.id })`) to fetch only necessary columns when only IDs are needed.
