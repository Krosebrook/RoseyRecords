## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-11 - Redundant DB Queries in Services
**Learning:** Checking entity existence in both the route handler and the storage/service layer causes redundant database queries (e.g., calling `getSong` in `routes.ts` and again in `storage.toggleLike`).
**Action:** Trust the route handler's existence check when passing IDs to storage methods, or push the check down entirely, to save a database round trip.
