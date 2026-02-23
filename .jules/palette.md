## 2026-02-09 - Invisible Focus Trap
**Learning:** Using `opacity-0 group-hover:opacity-100` on interactive elements (like buttons) creates a severe accessibility issue where keyboard users can focus an element but cannot see it.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or `focus-visible:opacity-100`) to ensure keyboard navigability.

## 2026-02-23 - Transient vs Persistent Actions
**Learning:** For generative AI interfaces, users often want to use the output immediately (Copy) without committing it to storage (Save). Providing both actions side-by-side reduces friction.
**Action:** Audit all generation result screens to ensure transient actions like "Copy" or "Share" are available alongside "Save".
