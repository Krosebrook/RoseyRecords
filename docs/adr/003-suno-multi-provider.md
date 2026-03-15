# ADR-003: Suno Multi-Provider Pattern

**Status:** Accepted
**Date:** 2026-01-25
**Context:** Suno API access strategy

## Decision

Implement a `MusicProvider` interface with three concrete implementations (DefAPI, Kie, SunoOrg) selectable via the `SUNO_PROVIDER` environment variable.

## Context

Suno does not offer a public API. Access is available through third-party proxy services, each with different pricing, rate limits, and reliability. We needed to:
- Support multiple providers for redundancy
- Allow easy switching without code changes
- Default to the most reliable provider (DefAPI)

## Provider Details

| Provider | Env Var | Models | Notes |
|---|---|---|---|
| DefAPI | `DEFAPI_API_KEY` | chirp-crow (v5), chirp-bluejay (v4.5+), chirp-auk (v4.5), chirp-v4 (v4) | Recommended; most reliable |
| Kie.ai | `KIE_API_KEY` | Same model set | Alternative provider |
| SunoOrg | `SUNO_API_KEY` | Limited | Session cookie-based (fragile) |

## Consequences

**Positive:**
- Provider redundancy — switch with a single env var change
- Clean abstraction via `MusicProvider` interface
- Easy to add new providers

**Negative:**
- Code complexity: three implementations to maintain
- Testing burden: need to verify each provider path
- Some providers may lag behind on model support
