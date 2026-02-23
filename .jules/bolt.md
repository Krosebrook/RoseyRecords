## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-10 - Explicit Column Selection
**Learning:** Using `getTableColumns` and destructuring to exclude fields is risky because critical fields (like `audioUrl`) might be accidentally assumed to be excluded or included. Implicit behavior leads to bugs.
**Action:** Use explicit column selection for summary views (e.g., `select({ id: table.id, ... })`) to ensure the "API contract" is clear and robust.

## 2026-02-10 - Drizzle nullsLast Compatibility
**Learning:** `orderBy(desc(col).nullsLast())` causes type errors in some Drizzle setups.
**Action:** Avoid `.nullsLast()` unless strictly necessary and supported by the environment; usually standard `desc()` suffices for effectively non-null columns.
