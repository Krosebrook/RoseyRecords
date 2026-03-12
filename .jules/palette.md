## 2026-02-09 - Invisible Focus Trap
**Learning:** Using `opacity-0 group-hover:opacity-100` on interactive elements (like buttons) creates a severe accessibility issue where keyboard users can focus an element but cannot see it.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or `focus-visible:opacity-100`) to ensure keyboard navigability.

## 2024-05-22 - Clickable Card Pattern
**Learning:** To create accessible clickable cards with nested interactive buttons without invalid HTML nesting, use a container `div` with `relative group`, an `absolute inset-0` link for the main action, and place nested buttons above it with `z-index` and `pointer-events-auto`.
**Action:** Apply this pattern whenever a card needs to be fully clickable but contains secondary actions like delete or favorite buttons.

## 2026-03-03 - Studio Piano Keys Accessibility
**Learning:** Custom interactive elements representing domain-specific controls (like Piano keys in the Studio view) lack native semantics. Without explicit `aria-label` (e.g., Note name) and `aria-pressed` attributes, they are completely inaccessible to screen readers and difficult to use for keyboard-only users who can't see the visual active state.
**Action:** Always add `aria-label`, `aria-pressed`, and `title` attributes to custom interactive controls that mimic toggleable elements, ensuring their state and purpose are exposed to assistive technologies.

## 2026-03-09 - Icon-Only Button Native Tooltips
**Learning:** Icon-only buttons with `aria-label` are accessible to screen readers, but sighted users rely on native hover tooltips provided by the `title` attribute to understand the action if there's no visible text.
**Action:** Always add a `title` attribute matching the `aria-label` to provide a native hover tooltip on icon-only buttons for sighted users.
## 2024-10-24 - Icon-only button tooltips
**Learning:** We have many `<Button size="icon">` instances that use `lucide-react` icons and correctly provide `aria-label`s for screen readers but omit `title` attributes. This leaves sighted users who don't use screen readers without a tooltip to explain the action, relying purely on iconography which can be ambiguous (e.g. download icon vs share icon). Some Radix tooltips are used but for simpler buttons the native browser tooltip is best.
**Action:** Always add a `title` attribute that matches the `aria-label` on any icon-only button to provide a native hover tooltip.
## 2026-02-12 - Robust Clipboard Pattern
**Learning:** To support older environments or restrictive contexts (like some embedded webviews), `navigator.clipboard.writeText` is insufficient on its own and should be paired with a `document.execCommand('copy')` fallback using a temporary textarea.
**Action:** When implementing copy functionality, always include the legacy fallback to ensure reliability across all user contexts.
## 2026-02-25 - Piano Keys Accessibility
**Learning:** Custom interactive elements like the Piano keys in `Studio.tsx` rely on visual color changes and position, but lack semantic labels and state for assistive technologies.
**Action:** Use `aria-label` (e.g., Note name) and `aria-pressed` attributes to communicate the element's identity and selection state to screen readers.
## 2024-05-19 - Missing Aria-labels and Titles on Icon-only Buttons
**Learning:** Across the application's list components (e.g., Favorites, Playlists, Explore), `size="icon"` buttons were consistently missing both `aria-label` and `title` attributes. Without these, the buttons are invisible to screen readers and lack native hover tooltips for sighted users.
**Action:** Always ensure that icon-only buttons include both `aria-label` (for screen readers) and `title` (for native tooltips) to guarantee full accessibility and a better user experience.
## 2026-02-14 - Invisible Focus Traps in List Items
**Learning:** Elements with `opacity-0 group-hover:opacity-100` create invisible focus traps for keyboard users.
**Action:** Always add `focus:opacity-100` alongside `group-hover:opacity-100` for interactive elements that appear on hover.
## 2026-02-23 - Transient vs Persistent Actions
**Learning:** For generative AI interfaces, users often want to use the output immediately (Copy) without committing it to storage (Save). Providing both actions side-by-side reduces friction.
**Action:** Audit all generation result screens to ensure transient actions like "Copy" or "Share" are available alongside "Save".
