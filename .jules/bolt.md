## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-25 - N+1 Query Optimization in Playlists
**Learning:** `getPlaylistWithSongs` was using an N+1 pattern (fetching IDs then fetching songs) which caused multiple DB round trips and required manual sorting.
**Action:** Replaced with a single `innerJoin` query using `getTableColumns` and `orderBy(playlistSongs.id)` to fetch songs in insertion order efficiently.
