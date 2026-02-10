## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.
