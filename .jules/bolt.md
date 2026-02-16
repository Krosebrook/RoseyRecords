## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-11 - Drizzle Query Instability
**Learning:** The `.nullsLast()` method on `desc()` sort operations causes type errors (`Property 'nullsLast' does not exist`) in this environment.
**Action:** Avoid `.nullsLast()` and rely on default null handling (or explicit `sql` fragments) for sorting.
