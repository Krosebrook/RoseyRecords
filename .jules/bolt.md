## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-12 - List View Payload Optimization
**Learning:** Truncating large text fields (lyrics) and excluding unused fields (description) in list endpoints significantly reduces payload size. However, this creates a "Summary vs Detail" pattern where the list data is incomplete.
**Action:** Always verify that edit/detail views use a separate endpoint that fetches the full record to prevent data loss. Be aware that Drizzle's `getTableColumns` and destructuring is a powerful way to implement this cleanly. Also, `desc().nullsLast()` may cause type errors in some environments; removing `.nullsLast()` is a valid workaround if the column is non-nullable.
