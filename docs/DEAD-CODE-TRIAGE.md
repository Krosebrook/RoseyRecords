# Dead Code Triage Report

**Date:** 2026-03-13
**Scope:** Full codebase scan — server, client, shared, scripts, root files
**Phase:** 0 (triage only — no code changes made; all actions await user approval)

---

## Scan Classes Covered

1. Renamed/suffixed files (`.old`, `.bak`, `.backup`, `.orig`, `_old`, `_v1`) — **none found**
2. Commented-out code blocks — **none found** (no structurally complete commented-out functions, routes, or components)
3. Orphaned exports — **2 found** (see §4)
4. Duplicate implementations — **1 found** (see §2)
5. Dead branches / permanently-off feature flags — **none found** (no `if (false)`, always-false env checks, or disabled feature flags)
6. Git history analysis — **completed** (see §10 for per-candidate evidence)
7. TODO/FIXME/restoration markers — **none found** (no TODO, FIXME, HACK, XXX, or restoration-intent comments anywhere in source files)
8. Stub/no-op functions — **1 found** (see §1)
9. Dead files & directories — **4 files, 3 directories** (see §6, §7)
10. `@ts-nocheck` suppressions — **10 files** (see §8)
11. Unmounted integration modules — **1 module** (see §9)
12. Model hash inconsistency — **2 async functions** (see §3)

---

## Candidate-Level Summary Table

| # | Candidate | Type | File | Current Replacement | Replacement Works? | Risk | Recommendation |
|---|---|---|---|---|---|---|---|
| C1 | `generateSunoLyrics()` | Stub/no-op | `server/services/suno.ts:474` | None — returns `""` | No — silently fails | Medium | Implement or remove route + function |
| C2 | `generateWithStableAudio25()` | Duplicate | `server/services/stableAudio.ts:156` | `generateFullTrack()` at line 129 | Yes — identical logic | Low | Remove; consolidate callers to `generateFullTrack` |
| C3 | `startMusicGeneration()` hash | Hash mismatch | `server/services/replicate.ts:209` | Sync variant uses `671ac645…` | Sync works; async may differ | Medium | Unify to `671ac645…` constant |
| C4 | `startMusicWithReference()` hash | Hash mismatch | `server/services/replicate.ts:325` | Sync variant uses `671ac645…` | Sync works; async may differ | Medium | Unify to `671ac645…` constant |
| C5 | `generateMusicFromMelody()` | Orphan export | `server/services/replicate.ts:97` | Async `startMusicGeneration` used instead | Yes | Low | Remove or document as reserved API |
| C6 | `generateMusicWithReference()` | Orphan export | `server/services/replicate.ts:286` | Async `startMusicWithReference` used instead | Yes | Low | Remove or document as reserved API |
| C7 | `main.py` | Dead file | root | N/A — Python scaffold | N/A | Low | Delete |
| C8 | `server.py` | Dead file | root | N/A — one-off verification server | N/A | Low | Delete |
| C9 | `verification/` | Dead directory | root | N/A — old a11y verification artifacts | N/A | Low | Delete entire directory |
| C10 | `script/build.mjs` | Dead file | `script/` | `script/build.ts` (used in package.json) | Yes | Low | Delete |
| C11 | `scripts/conflict-resolutions/` | Dead directory | root | Actual implementations in codebase | Yes | Low | Delete entire directory |
| C12 | `.jules/` | Dead directory | root | N/A — agent journal files | N/A | Low | Delete (user discretion) |
| C13 | `.github/agents/` | Dead directory | root | N/A — GitHub agent configs | N/A | Low | Delete (user discretion) |
| C14 | `registerAudioRoutes` | Unmounted module | `server/replit_integrations/audio/` | Custom routes in `routes.ts` | Yes | Low | Mount or remove |
| C15 | `@ts-nocheck` × 10 files | Type suppression | Various (see §8) | N/A | N/A | Medium | Remove progressively in Phase 1 |

---

## Detailed Findings

### §1. Stub / No-op Function — `generateSunoLyrics()` (C1)

**File:** `server/services/suno.ts:474`
```ts
export async function generateSunoLyrics(prompt: string): Promise<{ lyrics: string }> {
  return { lyrics: "" };
}
```

**Called from:** `server/routes.ts:1019` at `POST /api/suno/lyrics`
**Current replacement:** None — the route exists and is reachable but always returns empty lyrics.
**Replacement works?** No — silently fails for users.
**Git history:** Introduced in commit `fafa4a33` (2026-02-05) as a stub; never implemented.
**Recommendation (awaiting approval):** Either implement via the Suno provider's lyrics generation API, delegate to the existing OpenAI/Gemini lyrics generators, or remove the route and function together.

---

### §2. Duplicate Function — `generateWithStableAudio25()` (C2)

**File:** `server/services/stableAudio.ts:156`
**Duplicate of:** `generateFullTrack()` at line 129

Both functions have identical logic: same fal.ai endpoint (`fal-ai/stable-audio-25/text-to-audio`), same prompt building, same duration clamping, same output extraction. The only difference is the error message string (`"Stable Audio"` vs `"Stable Audio 2.5"`).

**Called from:** `server/routes.ts:728` (used when `useV25 && duration > 47`)
**Current replacement:** `generateFullTrack()` does the same thing.
**Replacement works?** Yes — identical behavior.
**Git history:** Both introduced in commit `53109dc5` (2026-01-24). `generateWithStableAudio25` was likely intended for a newer model version but was never differentiated.
**Recommendation (awaiting approval):** Remove `generateWithStableAudio25`; update `routes.ts:728` to call `generateFullTrack` instead.

---

### §3. Model Hash Inconsistency — Replicate (C3, C4)

**File:** `server/services/replicate.ts`

The **synchronous** functions (`replicate.run`) use MusicGen hash `671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb`, while the **asynchronous** functions (`predictions.create`) use hash `b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38`.

| Function | Mode | Hash | Line |
|---|---|---|---|
| `generateMusic()` | sync | `671ac645…` | 68 |
| `generateMusicFromMelody()` | sync | `671ac645…` | 105 |
| `generateSoundEffect()` | sync | `671ac645…` | 174 |
| `generateMusicWithReference()` | sync | `671ac645…` | 294 |
| `startMusicGeneration()` | async | `b05b1dff…` | 209 |
| `startMusicWithReference()` | async | `b05b1dff…` | 325 |

**Current replacement:** The sync functions work correctly with the `671ac645…` hash.
**Replacement works?** Yes for sync; async paths may target a different/older model version.
**Git history:** The `b05b1dff…` hash was set in commit `062c7f77` (2026-02-06) for async functions. The `671ac645…` hash was later updated in sync functions but the async functions were not updated to match.
**Recommendation (awaiting approval):** Extract the model hash into a single `MUSICGEN_VERSION` constant and use it in all 6 functions. Use `671ac645…` as the canonical hash (it is newer and used by the working sync path).

---

### §4. Orphan Exported Functions (C5, C6)

These functions are exported but never imported or called anywhere in the codebase:

| Function | File | Line | Async Counterpart (used) |
|---|---|---|---|
| `generateMusicFromMelody()` | `server/services/replicate.ts` | 97 | `startMusicGeneration()` (routes.ts:630) |
| `generateMusicWithReference()` | `server/services/replicate.ts` | 286 | `startMusicWithReference()` (routes.ts:1164) |

**Current replacement:** The async counterparts are used in routes instead.
**Replacement works?** Yes — the async versions provide the same functionality with polling.
**Recommendation (awaiting approval):** Remove these sync variants, or keep and document as "available for future synchronous use cases." Removing reduces API surface area and maintenance burden.

---

### §5. Alternative Suno Providers (Not Dead Code)

**File:** `server/services/suno.ts`
- `KieProvider` (line 315) — activates if `KIE_API_KEY` env var is set
- `SunoOrgProvider` (line 360) — activates if `SUNOAPI_COOKIE` env var is set

These are registered in the provider map (lines 417-418) and activate dynamically. Currently only `DEFAPI_API_KEY` is configured, so DefAPI is the active provider.

**Status:** NOT dead code — functional fallback providers with correct activation logic.
**Recommendation:** Keep as-is. Document DefAPI as the primary provider in architecture docs.

---

### §6. Dead Standalone Files (C7, C8, C9, C10)

#### `main.py` (root) — C7
```python
def main():
    print("Hello from repl-nix-workspace!")
```
Default Replit Python scaffold. The app runs on Node.js/Express. Not imported or referenced by any build artifact.
**Git history:** Introduced in commit `4789c92` ("Set up a new Python project with PyTorch dependencies") — predates the Node.js app.
**Recommendation (awaiting approval):** Delete.

#### `server.py` (root) — C8
A Python `http.server` serving `client/src/pages` on port 45775. A one-off verification utility.
**Git history:** Introduced in commit `c60aaa4` ("Palette: Add ARIA labels and titles to icon-only buttons") — created as a temporary verification tool.
**Recommendation (awaiting approval):** Delete.

#### `verification/` directory — C9
Contains:
- `server.js` — Express mock server on port 3001 with hardcoded test data
- `verify_studio_accessibility_final.py` — Playwright a11y test referencing `localhost:3001`
- `server.log` — 40 bytes of log output
- `studio_a11y.png` — 123 KB verification screenshot

All artifacts from a one-time accessibility verification run. Not part of the build or test pipeline.
**Git history:** Introduced in commit `11f45ae` (palette-studio-accessibility branch) — accessibility audit artifacts.
**Recommendation (awaiting approval):** Delete entire directory.

#### `script/build.mjs` — C10
`package.json` references `tsx script/build.ts` for the build command. `build.mjs` is an alternative JS build script that is never referenced in any config.
**Git history:** Introduced in commit `471bfac` ("Compile build script to JavaScript for deployment") — a compiled version that was superseded by the `.ts` original.
**Recommendation (awaiting approval):** Delete `build.mjs`.

---

### §7. Dead Directories (C11, C12, C13)

#### `scripts/conflict-resolutions/` — C11

Contains 4 TypeScript files documenting "correct" merge resolutions from past PRs:
- `client-utils-clipboard.ts` — clipboard utility from PR #34/#39
- `server-index-hsts.ts` — HSTS implementation from PR #23/#30
- `server-storage-song-list.ts` — song list selection from PR #35/#37/#40
- `server-utils-audio.ts` — audio MIME detection from PR #33/#38

These are reference documents, not executable code. They are not imported, built, or tested. The actual implementations already exist in the codebase at their proper locations.
**Git history:** Introduced in commit `e23dca8` ("Add comprehensive branch merge automation toolkit") on the `copilot/create-merge-automation-toolkit` branch.
**Recommendation (awaiting approval):** Delete entire directory.

#### `.jules/` — C12

Contains `bolt.md`, `palette.md`, `sentinel.md` — agent learning journals from a previous AI assistant. Informational markdown, not code.
**Recommendation (awaiting approval — user discretion):** Delete if learnings are no longer needed; keep if they serve as architectural reference.

#### `.github/agents/` — C13

Contains 17 `*.agent.md` files defining specialized agent personas for GitHub-based workflows (AI service integration, audio processing, security auditing, etc.). Not part of the build or runtime.
**Recommendation (awaiting approval — user discretion):** Delete if GitHub agent workflows are no longer used; keep if future GitHub AI workflows are planned.

---

### §8. `@ts-nocheck` Suppressions (C15)

10 files have `// @ts-nocheck` at line 1, disabling all TypeScript checking:

| File | Risk | Notes |
|---|---|---|
| `server/routes.ts` | High | Core API routes — 1200+ lines of business logic |
| `server/storage.ts` | High | Database operations — all CRUD |
| `server/db.ts` | Medium | Database connection setup |
| `server/vite.ts` | Low | Vite dev server — template code |
| `server/replit_integrations/audio/client.ts` | Medium | Audio integration client |
| `server/replit_integrations/audio/routes.ts` | Medium | Audio integration routes (unmounted — see §9) |
| `server/replit_integrations/batch/utils.ts` | Low | Batch processing utilities |
| `server/replit_integrations/chat/routes.ts` | Medium | Chat integration routes |
| `server/replit_integrations/image/client.ts` | Medium | Image integration client |
| `server/replit_integrations/image/routes.ts` | Medium | Image integration routes |

**Current replacement:** N/A — these suppressions were added to silence type errors rather than fix them.
**Recommendation (awaiting approval):** Address in Phase 1 audit. Priority order: `routes.ts` and `storage.ts` first (core business logic with highest runtime risk), then integration modules.

---

### §9. Unmounted Integration Module — Audio Routes (C14)

**File:** `server/replit_integrations/audio/`

`registerAudioRoutes` is exported from `server/replit_integrations/audio/index.ts` but is **never imported or called** in `server/routes.ts`. Only three integration modules are mounted:
- `registerAuthRoutes` ✓
- `registerChatRoutes` ✓
- `registerImageRoutes` ✓
- `registerAudioRoutes` ✗ (never mounted)

**Current replacement:** The app's custom audio generation routes in `routes.ts` handle all audio functionality (Suno, Stable Audio, MusicGen, ACE-Step).
**Replacement works?** Yes — the custom routes are comprehensive.
**Recommendation (awaiting approval):** Investigate whether the audio integration module provides additional functionality not covered by existing routes. If it duplicates, remove the module. If it adds value, mount it.

---

## §10. Git History Evidence

| Candidate | Commit | Date | Author | Evidence |
|---|---|---|---|---|
| C1 `generateSunoLyrics` | `fafa4a33` | 2026-02-05 | kylerosebrook | Introduced as a stub; `git blame` shows it has never been implemented beyond `return { lyrics: "" }` |
| C2 `generateWithStableAudio25` | `53109dc5` | 2026-01-24 | kylerosebrook | Created alongside `generateFullTrack` in the same commit; both had identical bodies from inception |
| C3 `startMusicGeneration` hash | `062c7f77` | 2026-02-06 | kylerosebrook | Hash `b05b1dff…` set in this commit; sync functions were later updated to `671ac645…` but async was not |
| C4 `startMusicWithReference` hash | `6b627d89` | 2026-02-06 | kylerosebrook | Same hash `b05b1dff…` used; sync counterpart `generateMusicWithReference` uses `671ac645…` |
| C7 `main.py` | `4789c92` | pre-2026-01 | kylerosebrook | Python project scaffold; predates Node.js conversion |
| C8 `server.py` | `c60aaa4` | ~2026-02 | kylerosebrook | Temporary verification server for accessibility audit |
| C9 `verification/` | `11f45ae` | ~2026-02 | palette branch | One-time accessibility verification artifacts |
| C10 `script/build.mjs` | `471bfac` | 2026-01 | kylerosebrook | Compiled JS build script; superseded by `.ts` original |
| C11 `scripts/conflict-resolutions/` | `e23dca8` | ~2026-02 | copilot branch | Merge automation toolkit — reference docs, not executable |

---

## Prioritized Action Plan (All Await User Approval)

### Tier 1 — High-confidence safe deletions
1. **Delete dead files:** `main.py`, `server.py`, `verification/`, `scripts/conflict-resolutions/`, `script/build.mjs`
2. **Fix `generateSunoLyrics` stub (C1):** Implement or remove route + function

### Tier 2 — Code consolidation
3. **Unify Replicate hashes (C3, C4):** Extract to constant, use `671ac645…` everywhere
4. **Remove `generateWithStableAudio25` duplicate (C2):** Update route to call `generateFullTrack`
5. **Evaluate orphan sync functions (C5, C6):** Remove or document

### Tier 3 — Structural improvements (Phase 1 audit)
6. **Investigate unmounted audio integration (C14):** Mount or remove
7. **Begin removing `@ts-nocheck` (C15):** Start with `routes.ts` and `storage.ts`

### Tier 4 — User discretion
8. **`.jules/` directory (C12):** Delete or keep as architectural reference
9. **`.github/agents/` directory (C13):** Delete or keep for future GitHub workflows
