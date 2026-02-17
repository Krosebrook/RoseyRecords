# Palette's Journal

## 2024-05-22 - SongCard Interaction Polish
**Learning:** Nested interactive elements (like delete buttons) inside a card with a full-cover link (`absolute inset-0`) require careful z-indexing (`z-20`) and event handling (`stopPropagation`) to function correctly without triggering the parent navigation.
**Action:** When improving these controls, preserve the `z-index` layering and ensure `pointer-events` are explicitly managed (auto for buttons, none for container) to maintain the "clickable card" pattern while keeping actions accessible.
