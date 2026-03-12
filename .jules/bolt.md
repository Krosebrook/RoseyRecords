## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-25 - N+1 Query Optimization in Playlists
**Learning:** `getPlaylistWithSongs` was using an N+1 pattern (fetching IDs then fetching songs) which caused multiple DB round trips and required manual sorting.
**Action:** Replaced with a single `innerJoin` query using `getTableColumns` and `orderBy(playlistSongs.id)` to fetch songs in insertion order efficiently.
## 2026-03-06 - Eliminate Read-Before-Write Database Round Trips
**Learning:** Redundant `SELECT` queries before atomic updates (like toggling a like) can be safely eliminated by relying on the `RETURNING` clause. However, the order of operations in the transaction is critical: the `UPDATE` must be executed *before* any `INSERT` operations on related tables to safely detect a missing primary record and prevent Foreign Key constraint errors.
**Action:** When migrating to atomic updates, restructure transaction steps to ensure the primary entity update and its existence check occur first.

## 2026-03-08 - Short-circuiting expensive array filters
**Learning:** Eager evaluation of complex filter callbacks runs expensive operations (like `.toLowerCase().includes()`) for every item, even when cheap exact-match conditions fail.
**Action:** When filtering arrays by multiple conditions, always implement early returns (`if (!cheapCondition) return false;`) to evaluate cheap checks first, completely skipping execution of expensive string operations for irrelevant items.
## 2024-03-09 - Client-side array sorting performance
**Learning:** Instantiating `new Date()` inside an `Array.prototype.sort` comparator is extremely slow and executes O(N log N) times. Furthermore, `String.prototype.localeCompare` is notoriously slow because it invokes the browser's heavy Internationalization (Intl) API.
**Action:** For timestamps or ISO 8601 formatted date strings returned from a database or API, use standard relational operators (e.g., `a > b ? 1 : -1`) instead of parsing dates or using localeCompare to improve client-side sorting performance. Ensure fallback values are strings (like `""`) to prevent NaN issues during comparison.
## 2026-03-11 - Short-circuit Array Filtering
**Learning:** Checking all conditions in a single boolean expression inside `.filter()` forces JavaScript to evaluate expensive string operations (like `.toLowerCase().includes()`) even when simpler, exact-match checks (like `.genre === genreFilter`) would have already disqualified the item.
**Action:** Always structure filter callbacks with early returns for cheap operations first. This completely skips O(N) string allocations for items that fail basic categorical filters.
## 2026-02-12 - List View Payload Optimization
**Learning:** Truncating large text fields (lyrics) and excluding unused fields (description) in list endpoints significantly reduces payload size. However, this creates a "Summary vs Detail" pattern where the list data is incomplete.
**Action:** Always verify that edit/detail views use a separate endpoint that fetches the full record to prevent data loss. Be aware that Drizzle's `getTableColumns` and destructuring is a powerful way to implement this cleanly. Also, `desc().nullsLast()` may cause type errors in some environments; removing `.nullsLast()` is a valid workaround if the column is non-nullable.
## 2026-03-01 - Join Optimization
**Learning:** Fetching related items (like songs in a playlist) by first fetching IDs and then fetching items (N+1-ish) is inefficient and complex to sort manually.
**Action:** Use `innerJoin` with `orderBy` on the join table to fetch related items in a single query with correct ordering, reducing round trips and code complexity.

## 2026-03-01 - Drizzle nullsLast
**Learning:** The `.nullsLast()` method on `desc()` may not be available or cause type errors in some Drizzle versions/configurations.
**Action:** Remove `.nullsLast()` if the column is effectively non-nullable (e.g., `defaultNow()`), or use `sql` operator if strictly needed.
## 2026-02-11 - Drizzle Query Instability
**Learning:** The `.nullsLast()` method on `desc()` sort operations causes type errors (`Property 'nullsLast' does not exist`) in this environment.
**Action:** Avoid `.nullsLast()` and rely on default null handling (or explicit `sql` fragments) for sorting.
## 2026-02-12 - Drizzle ORM N+1 and Type Issues
**Learning:** Fetching items by ID list (N+1) is inefficient; replace with `innerJoin` and `orderBy` on the join table. Also, `.nullsLast()` on `desc()` sort operations causes type errors in Drizzle 0.39.3; rely on default sorting for non-nullable columns.
**Action:** Use `db.select(getTableColumns(T)).from(T).innerJoin(...)` for related data fetching.
