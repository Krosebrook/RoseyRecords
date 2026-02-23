## 2026-02-10 - Atomic Database Updates
**Learning:** Read-modify-write patterns for counters (like `playCount`) cause race conditions and extra DB round trips.
**Action:** Use atomic SQL updates (e.g., `playCount = playCount + 1`) with `returning()` to ensure data integrity and performance.

## 2026-02-23 - Playwright Verification with Service Workers
**Learning:** Service Workers in PWA-enabled apps intercept network requests, bypassing Playwright's `page.route` intercepts unless explicitly blocked.
**Action:** Always initialize Playwright browser context with `service_workers='block'` when mocking API responses for PWA frontends.
