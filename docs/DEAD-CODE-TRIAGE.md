# Dead Code Triage Report

**Date:** 2026-03-13
**Scope:** Full codebase scan — server, client, shared, scripts, root files
**Phase:** 0 (triage only — no code changes)

---

## Summary

| Category | Count | Severity |
|---|---|---|
| Stub / No-op functions | 1 | Medium |
| Duplicate functions | 1 | Low |
| Hash inconsistency (async vs sync) | 2 functions | Medium |
| Orphan exported functions (never imported) | 2 | Low |
| Dead standalone files | 4 files | Low |
| Dead directories | 3 dirs | Low |
| `@ts-nocheck` suppressions | 10 files | Medium |

---

## 1. Stub / No-op Functions

### `generateSunoLyrics()` — `server/services/suno.ts:474`

```ts
export async function generateSunoLyrics(prompt: string): Promise<{ lyrics: string }> {
  return { lyrics: "" };
}
```

**Status:** Called from `server/routes.ts:1019` at `POST /api/suno/lyrics`.
**Impact:** Any user calling this endpoint gets an empty string back — silently fails.
**Recommendation:** Either implement via the Suno provider's lyrics API, delegate to OpenAI/Gemini lyrics generation, or remove the route and function together.

---

## 2. Duplicate Functions

### `generateWithStableAudio25()` — `server/services/stableAudio.ts:156`

Identical body to `generateFullTrack()` at line 129 — same endpoint, same logic, only the error message string differs (`"Stable Audio"` vs `"Stable Audio 2.5"`).

**Status:** Called from `server/routes.ts:728` (used when `useV25 && duration > 47`).
**Recommendation:** Remove `generateWithStableAudio25` and consolidate callers to use `generateFullTrack`. The distinction is cosmetic.

---

## 3. Model Hash Inconsistency (Replicate)

In `server/services/replicate.ts`, the **synchronous** functions use one MusicGen hash and the **asynchronous** functions use a different one:

| Function | Mode | Hash |
|---|---|---|
| `generateMusic()` (line 68) | sync (`replicate.run`) | `671ac645...` |
| `generateMusicFromMelody()` (line 105) | sync | `671ac645...` |
| `generateSoundEffect()` (line 174) | sync | `671ac645...` |
| `generateMusicWithReference()` (line 294) | sync | `671ac645...` |
| `startMusicGeneration()` (line 208) | async (`predictions.create`) | `b05b1dff...` |
| `startMusicWithReference()` (line 324) | async | `b05b1dff...` |

**Impact:** Sync and async paths may target different model versions on Replicate, causing inconsistent audio quality or behavior.
**Recommendation:** Unify all functions to use the same hash (`671ac645...` is the one used in `replicate.run` calls and appears to be current). Extract the hash into a single constant.

---

## 4. Orphan Exported Functions (Never Imported)

These functions are exported from service modules but never imported or called anywhere in the codebase:

| Function | File | Line |
|---|---|---|
| `generateMusicFromMelody()` | `server/services/replicate.ts` | 97 |
| `generateMusicWithReference()` | `server/services/replicate.ts` | 286 |

**Note:** `generateMusicFromMelody` is the sync melody-continuation variant. `generateMusicWithReference` is the sync reference-audio variant. Their async counterparts (`startMusicGeneration`, `startMusicWithReference`) *are* used in routes.
**Recommendation:** Verify whether these sync variants are needed for any planned feature. If not, remove them. If they are useful, they may simply be "available but unused" API surface — acceptable to keep if documented.

---

## 5. Alternative Suno Providers (KieProvider, SunoOrgProvider)

In `server/services/suno.ts`:
- `KieProvider` (line 315) — requires a `KIE_API_KEY` env var
- `SunoOrgProvider` (line 360) — requires a `SUNOAPI_COOKIE` env var

These are registered in the provider map (lines 417-418) but only activate if their respective env vars are set. Currently only `DEFAPI_API_KEY` is configured.

**Status:** Not dead code — they are functional alternative backends. They activate dynamically based on env vars.
**Recommendation:** Keep as-is. These provide fallback flexibility. Document in the architecture docs that DefAPI is the primary provider.

---

## 6. Dead Standalone Files

### `main.py` (root)
```python
def main():
    print("Hello from repl-nix-workspace!")
```
Default Replit Python scaffold. The app runs on Node.js/Express. **Delete.**

### `server.py` (root)
A Python `http.server` serving `client/src/pages` on port 45775 with mock API endpoints. Appears to be a one-off verification server. **Delete.**

### `verification/` directory
Contains:
- `server.js` — Express mock server on port 3001 with hardcoded mock data
- `verify_studio_accessibility_final.py` — Playwright a11y test script referencing `localhost:3001`
- `server.log` — 40 bytes
- `studio_a11y.png` — 123 KB screenshot

All artifacts from a previous accessibility verification run. Not part of the build or test pipeline. **Delete entire directory.**

### `script/build.mjs` (alongside `script/build.ts`)
`package.json` references `tsx script/build.ts` for the build command. `build.mjs` is an alternative build script that is never referenced. **Delete `build.mjs`.**

---

## 7. Dead Directories

### `scripts/conflict-resolutions/` (4 files)

Contains 4 TypeScript files that document "correct" merge resolutions from past PRs:
- `client-utils-clipboard.ts` — clipboard utility from PR #34/#39
- `server-index-hsts.ts` — HSTS implementation from PR #23/#30
- `server-storage-song-list.ts` — song list selection from PR #35/#37/#40
- `server-utils-audio.ts` — audio MIME detection from PR #33/#38

These are reference documents, not executable code. They are not imported or built. **Delete entire directory** (the actual implementations already live in the codebase proper).

### `.jules/` (3 files)

Contains `bolt.md`, `palette.md`, `sentinel.md` — agent learning journals from a previous AI assistant (Jules). These are informational markdown files, not code. Not referenced by any build or runtime artifact.
**Recommendation:** Keep or delete at user discretion. They contain useful architectural learnings but are not part of the codebase.

### `.github/agents/` (17 files)

Contains 17 `*.agent.md` files defining various specialized agent personas (AI service integration, API endpoint builder, audio processing, etc.). These are GitHub-specific agent configuration files from a previous workflow.
**Recommendation:** Keep or delete at user discretion. They are not part of the build but may be useful for future GitHub-based AI workflows.

---

## 8. `@ts-nocheck` Suppressions

The following 10 files have `// @ts-nocheck` at line 1, disabling all TypeScript checking:

| File | Notes |
|---|---|
| `server/routes.ts` | Core API routes — highest risk |
| `server/storage.ts` | Database operations — high risk |
| `server/db.ts` | Database connection |
| `server/vite.ts` | Vite dev server setup |
| `server/replit_integrations/audio/client.ts` | Audio integration client |
| `server/replit_integrations/audio/routes.ts` | Audio integration routes |
| `server/replit_integrations/batch/utils.ts` | Batch processing utilities |
| `server/replit_integrations/chat/routes.ts` | Chat integration routes |
| `server/replit_integrations/image/client.ts` | Image integration client |
| `server/replit_integrations/image/routes.ts` | Image integration routes |

**Impact:** Type errors in these files are invisible, increasing risk of runtime bugs.
**Recommendation:** Address in Phase 1 audit. Priority: `routes.ts` and `storage.ts` first (core business logic), then integration modules.

---

## 9. Replit Integration Modules — Audio (Unused)

`server/replit_integrations/audio/` exports `registerAudioRoutes`, but this function is **never called** in `server/routes.ts`. Only `registerAuthRoutes`, `registerChatRoutes`, and `registerImageRoutes` are imported and registered.

**Status:** The audio integration routes are defined but never mounted — effectively dead code.
**Recommendation:** Either mount the routes if the audio integration is needed, or document why it's excluded. If it duplicates the existing `stableAudio` / `replicate` service routes, remove it.

---

## Prioritized Action Plan

### Immediate (before Phase 1 audit)
1. **Delete dead files:** `main.py`, `server.py`, `verification/`, `scripts/conflict-resolutions/`, `script/build.mjs`
2. **Fix `generateSunoLyrics` stub:** Either implement or remove route + function
3. **Unify Replicate hashes:** Extract model hash to constant, use consistently

### Phase 1 (during full audit)
4. Remove `generateWithStableAudio25` duplicate
5. Evaluate orphan sync functions in `replicate.ts`
6. Investigate unmounted audio integration routes
7. Begin removing `@ts-nocheck` from `routes.ts` and `storage.ts`

### Phase 2 (documentation)
8. Document provider fallback architecture (DefAPI/Kie/SunoOrg)
9. Document `.jules/` and `.github/agents/` purpose and retention decision
