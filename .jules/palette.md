## 2026-02-09 - Invisible Focus Trap
**Learning:** Using `opacity-0 group-hover:opacity-100` on interactive elements (like buttons) creates a severe accessibility issue where keyboard users can focus an element but cannot see it.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or `focus-visible:opacity-100`) to ensure keyboard navigability.
