## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-03-01 - Debouncing Frontend Filter Computations
**Learning:** Performing case-insensitive substring searches across multiple fields (`title`, `lyrics`) inside a `useMemo` block driven by a synchronous keystroke state can freeze the main thread when data arrays grow.
**Action:** Always decouple the `input` value state from the derived computation state using a `useDebounce` hook (e.g., `client/src/hooks/use-debounce.ts`). This allows instant typing feedback while deferring heavy array iterations until the user pauses.
