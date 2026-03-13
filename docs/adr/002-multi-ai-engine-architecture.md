# ADR-002: Multi-AI-Engine Architecture

**Status:** Accepted
**Date:** 2026-01-24
**Context:** Music and lyrics generation engine selection

## Decision

Integrate multiple AI engines for different generation tasks rather than relying on a single provider.

## Current Engine Map

| Engine | Provider | Task | Model |
|---|---|---|---|
| OpenAI | Replit Integration | Fast lyrics, AI suggestions | gpt-5.2 |
| Gemini | Replit Integration | Song concepts, music theory | gemini-3-pro-preview |
| Suno/DefAPI | DefAPI proxy | Studio-quality songs with vocals | chirp-bluejay (default) |
| MusicGen | Replicate | Short instrumental clips | facebook/musicgen-large |
| Stable Audio | fal.ai | Extended instrumentals (up to 3min) | stable-audio-25 |
| Bark | Replicate | AI singing vocals | suno/bark |
| ACE-Step 1.5 | Replicate | Full commercial-grade songs | ace-step-v1-5-large |

## Context

No single AI provider excels at all music generation tasks. We needed:
- Fast lyrics generation (< 5s response)
- Comprehensive song concept analysis
- Short audio previews for rapid iteration
- Extended instrumentals for full tracks
- Studio-quality vocals
- Full songs with vocal+instrumental in one pass

## Consequences

**Positive:**
- Best-of-breed: each engine handles what it does best
- Redundancy: if one provider is down, others still work
- User choice: different quality/speed tradeoffs
- Competitive pricing across providers

**Negative:**
- Complex configuration: 7+ API keys to manage
- Inconsistent output formats across providers
- Higher maintenance burden (API changes, deprecations)
- User confusion: too many engine choices

**Risks:**
- Provider API changes require rapid adaptation
- Cost unpredictability across multiple billing relationships
- Rate limits vary by provider
