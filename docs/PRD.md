# HarmoniQ Product Requirements Document (PRD)

**Last Updated:** 2026-03-13
**Version:** 1.3.x
**Status:** Post-Beta Planning

## Vision

HarmoniQ empowers anyone to create studio-quality music and lyrics using AI, regardless of musical experience. The platform provides an accessible, visually engaging interface that makes professional music creation feel effortless.

## Target Users

| Persona | Description | Key Need |
|---|---|---|
| Casual Creator | No music background, wants to make songs for fun | Simple prompt → complete song |
| Content Creator | Needs background music/jingles for videos | Genre-specific instrumentals, quick turnaround |
| Aspiring Artist | Some music knowledge, wants AI assistance | Lyrics help, production tips, vocal generation |
| Hobbyist Producer | Understands music theory, experiments with AI | Multi-engine control, mixing, theory tools |

## Core Features (Shipped)

### 1. AI Lyrics Generation
- Dual-engine: OpenAI (fast) and Gemini (comprehensive concepts)
- Genre and mood-aware structured lyrics (verse/chorus/bridge)
- AI Suggest button for creative prompts across the app
- Song concept analysis with BPM, key, energy recommendations

### 2. Multi-Engine Audio Generation
- **Suno/DefAPI**: Studio-quality full songs with realistic vocals (chirp-bluejay default)
- **MusicGen**: Short instrumental clips for rapid iteration
- **Stable Audio**: Extended instrumentals up to 3 minutes (sample-first workflow)
- **ACE-Step 1.5**: Commercial-grade full songs with vocals
- **Bark**: AI singing vocals with 10 voice presets

### 3. Music Studio
- Audio generation tab with genre/duration controls
- Vocals tab with Bark AI singing
- Mix tab for combining instrumentals + vocals
- Music Theory tab: chord progressions, scale finder, production tips

### 4. User Library & Social
- Personal song management (CRUD, visibility toggle)
- Public Explore page with search and like system
- Playlist creation and management
- Song detail pages with play count tracking

### 5. Audio Visualizer
- Interactive synthwave-themed visualizer
- Circular equalizer, frequency spectrum, waveform
- Audio file upload and playback

### 6. Platform Features
- Replit Auth (OIDC) single sign-on
- PWA: offline caching, installable
- AI-guided onboarding tours
- Responsive design (mobile/tablet/desktop)
- Dark synthwave theme

## Planned Features (Not Yet Implemented)

| Feature | Status | Priority |
|---|---|---|
| Sound Marketplace | Coming Soon stub | Medium |
| Mixing Console | Coming Soon stub | Medium |
| Video Creator | Coming Soon stub | Low |
| Activity Feed | Coming Soon stub | Low |
| Collaboration | Not started | Future |
| Monetization/Credits | Not started | Future |

## Non-Functional Requirements

| Requirement | Current State | Target |
|---|---|---|
| Response time (API) | < 500ms for CRUD, 5-60s for AI generation | Same |
| Availability | Replit Autoscale (single region) | 99.5% |
| Concurrent users | Not tested | 100+ simultaneous |
| Audio generation timeout | 5 minutes (Suno polling) | Same |
| Session duration | 7 days | Same |
| Rate limiting | 50 AI req/15min, 100 write req/15min | Same |

## Success Metrics

1. **Engagement**: Songs generated per user per session
2. **Retention**: 7-day return rate
3. **Quality**: Song completion rate (lyrics → audio)
4. **Social**: Public song share rate, likes per song
5. **Platform**: Error rate < 1%, p95 latency < 2s for CRUD
