## 2026-02-09 - Invisible Focus Trap
**Learning:** Using `opacity-0 group-hover:opacity-100` on interactive elements (like buttons) creates a severe accessibility issue where keyboard users can focus an element but cannot see it.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or `focus-visible:opacity-100`) to ensure keyboard navigability.

## 2026-02-12 - Robust Clipboard Pattern
**Learning:** To support older environments or restrictive contexts (like some embedded webviews), `navigator.clipboard.writeText` is insufficient on its own and should be paired with a `document.execCommand('copy')` fallback using a temporary textarea.
**Action:** When implementing copy functionality, always include the legacy fallback to ensure reliability across all user contexts.
