## 2026-02-09 - Invisible Focus Trap
**Learning:** Using `opacity-0 group-hover:opacity-100` on interactive elements (like buttons) creates a severe accessibility issue where keyboard users can focus an element but cannot see it.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or `focus-visible:opacity-100`) to ensure keyboard navigability.

## 2024-05-22 - Clickable Card Pattern
**Learning:** To create accessible clickable cards with nested interactive buttons without invalid HTML nesting, use a container `div` with `relative group`, an `absolute inset-0` link for the main action, and place nested buttons above it with `z-index` and `pointer-events-auto`.
**Action:** Apply this pattern whenever a card needs to be fully clickable but contains secondary actions like delete or favorite buttons.

## 2026-03-03 - Studio Piano Keys Accessibility
**Learning:** Custom interactive elements representing domain-specific controls (like Piano keys in the Studio view) lack native semantics. Without explicit `aria-label` (e.g., Note name) and `aria-pressed` attributes, they are completely inaccessible to screen readers and difficult to use for keyboard-only users who can't see the visual active state.
**Action:** Always add `aria-label`, `aria-pressed`, and `title` attributes to custom interactive controls that mimic toggleable elements, ensuring their state and purpose are exposed to assistive technologies.

## 2024-10-24 - Icon-only button tooltips
**Learning:** We have many `<Button size="icon">` instances that use `lucide-react` icons and correctly provide `aria-label`s for screen readers but omit `title` attributes. This leaves sighted users who don't use screen readers without a tooltip to explain the action, relying purely on iconography which can be ambiguous (e.g. download icon vs share icon). Some Radix tooltips are used but for simpler buttons the native browser tooltip is best.
**Action:** Always add a `title` attribute that matches the `aria-label` on any icon-only button to provide a native hover tooltip.
