## 2026-02-09 - Invisible Focus Trap
**Learning:** Using `opacity-0 group-hover:opacity-100` on interactive elements (like buttons) creates a severe accessibility issue where keyboard users can focus an element but cannot see it.
**Action:** Always pair `group-hover:opacity-100` with `focus:opacity-100` (or `focus-visible:opacity-100`) to ensure keyboard navigability.

## 2026-05-21 - Async Button Feedback
**Learning:** Raw `<button>` elements triggering async actions without loading states lead to user confusion and potential double-submissions. Using the design system's `Button` component simplifies adding loading states and ensures consistent focus management.
**Action:** Always replace raw `<button>` elements performing async tasks with `Button` components that include a `disabled={loading}` state and a visual spinner.
