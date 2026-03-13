# HarmoniQ Roadmap

**Last Updated:** 2026-03-13

## Completed Milestones

### v1.0.0 (2026-01-23) - Initial Release
- Replit Auth with OIDC
- AI lyrics generation (OpenAI)
- Dashboard, Explore, Song Details
- PostgreSQL with Drizzle ORM
- Synthwave dark theme

### v1.1.0 (2026-01-24) - Studio & Multi-Engine
- Gemini AI integration (song concepts, music theory)
- Stable Audio via fal.ai (extended instrumentals)
- Music Studio page (audio/vocals/theory tabs)
- Bark AI singing vocals (10 voice presets)
- PWA support (service worker, manifest)
- Draft saving (localStorage)

### v1.2.0 (2026-01-25) - Visualizer & Onboarding
- Audio Visualizer page (equalizer, spectrum, waveform)
- AI-guided onboarding tours
- Dynamic page titles (SEO)
- HarmoniQ branding refresh

### v1.3.0 (2026-01-26) - Responsive & Stability
- Full responsive design (mobile/tablet/desktop)
- Audio playback error handling
- AI service unavailability recovery

### Post-1.3.0 (2026-01 to 2026-03) - Engine & Quality Updates
- Suno model updates (chirp-crow v5, deprecated v3.x removal)
- ACE-Step 1.5 integration
- Multi-provider Suno architecture (DefAPI/Kie/SunoOrg)
- Rate limiting (AI + write endpoints)
- Security hardening (headers, sanitization)
- Production readiness audit
- Dead code triage
- Comprehensive documentation suite

## Current Phase: Stabilization & Documentation

### In Progress
- Full codebase audit and documentation generation (13 documents)
- E2E testing across all features
- Code quality improvements (`@ts-nocheck` removal plan)

## WSJF Prioritization

Scoring: BV = Business Value (1-10), TC = Time Criticality (1-10), RR = Risk Reduction / Opportunity Enablement (1-10), JS = Job Size (1-10, lower = smaller). **WSJF = (BV + TC + RR) / JS**.

| Initiative | BV | TC | RR | JS | WSJF | Phase |
|---|---|---|---|---|---|---|
| Remove `@ts-nocheck` (10 files) | 5 | 6 | 9 | 3 | **6.7** | Q2 Near |
| CI pipeline (type check + tests) | 6 | 7 | 8 | 4 | **5.3** | Q2 Near |
| Unit tests for storage layer | 5 | 5 | 8 | 4 | **4.5** | Q2 Near |
| Redis rate limiting | 4 | 5 | 7 | 3 | **5.3** | Q2 Near |
| Structured logging | 4 | 4 | 6 | 3 | **4.7** | Q2 Near |
| Health check endpoint | 3 | 4 | 5 | 1 | **12.0** | Q2 Near |
| Style reference upload | 6 | 3 | 4 | 3 | **4.3** | Q2 Near |
| Sound Marketplace | 7 | 3 | 3 | 7 | **1.9** | Q2 Near |
| Mixing Console + AI Mastering | 8 | 3 | 3 | 8 | **1.8** | Q2 Near |
| Video Creator | 8 | 2 | 4 | 8 | **1.8** | Q3 Mid |
| Activity Feed | 6 | 3 | 4 | 5 | **2.6** | Q3 Mid |
| Collaboration features | 7 | 2 | 5 | 9 | **1.6** | Q3 Mid |
| User credits/monetization | 9 | 4 | 6 | 7 | **2.7** | Q3 Mid |
| CDN audio delivery | 5 | 3 | 6 | 4 | **3.5** | Q3 Mid |
| Mobile native app | 8 | 2 | 3 | 10 | **1.3** | Q4+ Long |
| Real-time collaboration | 7 | 1 | 4 | 9 | **1.3** | Q4+ Long |
| AI voice cloning | 8 | 2 | 4 | 8 | **1.8** | Q4+ Long |
| Music distribution | 9 | 2 | 5 | 7 | **2.3** | Q4+ Long |

## Planned: Near-Term (Q2 2026)

### Quality & Developer Experience (highest WSJF)
- [ ] Health check endpoint (WSJF: 12.0)
- [ ] Remove `@ts-nocheck` from all 10 files (WSJF: 6.7)
- [ ] Set up CI pipeline with type checking (WSJF: 5.3)
- [ ] Distributed rate limiting — Redis-backed (WSJF: 5.3)
- [ ] Structured logging — JSON format (WSJF: 4.7)
- [ ] Add unit tests for storage layer (WSJF: 4.5)
- [ ] Reduce `any` type usage (55+ instances)
- [ ] Add integration tests for API routes
- [ ] Database connection pooling optimization

### Feature Completion
- [ ] Style reference upload for MusicGen (WSJF: 4.3)
- [ ] Sound Marketplace — browse/discover sound packs (WSJF: 1.9)
- [ ] Mixing Console — multi-channel mixer with EQ (WSJF: 1.8)
- [ ] AI Mastering — preset-based master output processing

## Planned: Mid-Term (Q3 2026)

### Features
- [ ] CDN for audio file delivery (WSJF: 3.5)
- [ ] User credits/monetization system (WSJF: 2.7)
- [ ] Activity Feed — notifications, likes, followers (WSJF: 2.6)
- [ ] Video Creator — AI music video with beat sync (WSJF: 1.8)
- [ ] Collaboration features — shared projects (WSJF: 1.6)

### Platform
- [ ] Multi-region deployment
- [ ] Database read replicas
- [ ] Automated backups and disaster recovery

## Planned: Long-Term (Q4 2026+)

- [ ] Music distribution integration — Spotify, Apple Music (WSJF: 2.3)
- [ ] AI voice cloning (WSJF: 1.8)
- [ ] Mobile native app — React Native (WSJF: 1.3)
- [ ] Real-time collaboration — WebSocket (WSJF: 1.3)
- [ ] Stem separation / remix tools
- [ ] Subscription tiers
