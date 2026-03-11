## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-25 - N+1 Query Optimization in Playlists
**Learning:** `getPlaylistWithSongs` was using an N+1 pattern (fetching IDs then fetching songs) which caused multiple DB round trips and required manual sorting.
**Action:** Replaced with a single `innerJoin` query using `getTableColumns` and `orderBy(playlistSongs.id)` to fetch songs in insertion order efficiently.
## 2026-03-06 - Eliminate Read-Before-Write Database Round Trips
**Learning:** Redundant `SELECT` queries before atomic updates (like toggling a like) can be safely eliminated by relying on the `RETURNING` clause. However, the order of operations in the transaction is critical: the `UPDATE` must be executed *before* any `INSERT` operations on related tables to safely detect a missing primary record and prevent Foreign Key constraint errors.
**Action:** When migrating to atomic updates, restructure transaction steps to ensure the primary entity update and its existence check occur first.

## 2026-03-11 - Short-circuit Array Filtering
**Learning:** Checking all conditions in a single boolean expression inside `.filter()` forces JavaScript to evaluate expensive string operations (like `.toLowerCase().includes()`) even when simpler, exact-match checks (like `.genre === genreFilter`) would have already disqualified the item.
**Action:** Always structure filter callbacks with early returns for cheap operations first. This completely skips O(N) string allocations for items that fail basic categorical filters.
