## 2026-02-09 - Invisible Focus Trap
**Learning:** Using `opacity-0 group-hover:opacity-100` on interactive elements (like buttons) creates a severe accessibility issue where keyboard users can focus an element but cannot see it.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or `focus-visible:opacity-100`) to ensure keyboard navigability.

## 2024-05-22 - Clickable Card Pattern
**Learning:** To create accessible clickable cards with nested interactive buttons without invalid HTML nesting, use a container `div` with `relative group`, an `absolute inset-0` link for the main action, and place nested buttons above it with `z-index` and `pointer-events-auto`.
**Action:** Apply this pattern whenever a card needs to be fully clickable but contains secondary actions like delete or favorite buttons.
