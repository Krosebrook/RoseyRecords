# Changelog

All notable changes to HarmoniQ are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **ACE-Step 1.5 Integration**: Commercial-grade full song generation via Replicate
- **Multi-Provider Suno Architecture**: DefAPI, Kie, SunoOrg providers selectable via `SUNO_PROVIDER` env var
- **Rate Limiting**: AI endpoints (50 req/15min) and write endpoints (100 req/15min) with per-user tracking
- **Security Headers**: X-Content-Type-Options, X-XSS-Protection (X-Frame-Options omitted for Replit iframe compatibility)
- **Log Sanitization**: `sanitizeLog()` redacts sensitive data (passwords, tokens, emails, PII) from server logs
- **Admin Bypass**: `ADMIN_USER_IDS` env var for unlimited Suno credits

### Changed
- **OpenAI Model**: Updated from gpt-4o-mini/gpt-4o to gpt-5.2
- **Gemini Model**: Updated from gemini-2.5-flash to gemini-3-pro-preview (all 8 instances)
- **Suno Models**: Switched to bird codenames (chirp-crow v5, chirp-bluejay v4.5+ default, chirp-auk v4.5, chirp-v4 v4)
- **MusicGen**: Updated Replicate model hash to 671ac645

### Removed
- **Deprecated Suno Models**: Removed v3/v3.5 model references

### Documentation
- Full codebase audit completed (2026-03-13)
- 13-document documentation suite generated:
  - `.env.example`, `ARCHITECTURE.md`, `API.md`, `PRD.md`, `ROADMAP.md`
  - `CONTRIBUTING.md`, `RUNBOOK.md`, `DATABASE.md`, `SECURITY.md`, `AUDIT-REPORT.md`
  - 5 Architecture Decision Records (ADRs)
- Dead code triage completed (`DEAD-CODE-TRIAGE.md`) with 15 candidates identified

### Planning
- Production readiness audit (score: 25/50 PROTOTYPE)
- Beta testing strategy (3-phase rollout plan)
- Security audit and hardening recommendations

## [1.3.0] - 2026-01-26

### Added
- **Responsive Design**: Full mobile, tablet, and desktop support across all pages
  - Landing page with adaptive hero section and feature cards
  - Generate page with stacked mobile layout
  - Studio page with horizontally scrollable tabs on mobile
  - Visualizer with compact mobile controls
  - Song details with responsive typography

### Fixed
- Audio playback error handling to prevent crashes when media fails to load
- Better error recovery when AI services are unavailable

## [1.2.0] - 2026-01-25

### Added
- **Audio Visualizer Page**: Interactive synthwave-themed audio visualizer
  - Circular equalizer with frequency-based particle effects
  - Frequency spectrum analyzer display
  - Waveform visualization
  - Audio file upload and playback controls
  - Loop toggle and seek functionality

- **AI-Guided Onboarding**: Interactive walkthrough tours for new users
  - Dashboard tour explaining core features
  - Generate page tour for lyrics creation
  - Studio page tour for music production

- **Dynamic Page Titles**: usePageTitle hook for SEO-friendly browser titles

- **HarmoniQ Branding**: Updated branding throughout the UI
  - New hero section messaging
  - Updated feature card descriptions
  - Consistent brand identity in footer

## [1.1.0] - 2026-01-24

### Added
- **Gemini AI Integration**: Advanced song concept generation
  - Full song analysis with BPM, key, and energy recommendations
  - Comprehensive lyrics with structural annotations
  - AI engine selector (OpenAI vs Gemini) on Generate page

- **Stable Audio Integration**: Extended duration music generation via fal.ai
  - Support for tracks up to 3 minutes
  - Sample-first workflow (15s preview before full generation)
  - Async generation with progress polling

- **Music Studio Page**: Comprehensive music creation interface
  - Audio generation tab with genre and duration controls
  - Vocals tab with Bark AI singing generation
  - Mix tab for combining instrumentals and vocals
  - Music Theory tab with chord progression generator and scale finder

- **Bark AI Vocals**: True singing AI vocals via Replicate
  - 10 voice presets (5 male, 5 female)
  - Temperature control for voice variation
  - Lyrics-to-singing generation

- **Audio Player Enhancements**:
  - Progress bar with seek functionality
  - Duration display for longer tracks
  - Mute toggle control

- **PWA Support**: Progressive Web App capabilities
  - manifest.json for app installation
  - Service worker for offline caching
  - Lazy loading for all routes

- **Draft Saving**: localStorage utilities for saving work-in-progress

## [1.0.0] - 2026-01-23

### Added
- Initial release of HarmoniQ
- **User Authentication**: Replit Auth with OpenID Connect
- **Lyrics Generation**: AI-powered lyrics creation with OpenAI
  - Topic-based generation
  - Genre and mood selection
  - Verse/chorus structure
- **Dashboard**: Personal song library management
- **Explore Page**: Browse and like public songs
- **Song Details**: View and manage individual songs
- **Database**: PostgreSQL with Drizzle ORM
- **Responsive Layout**: Sidebar navigation with mobile support
- **Dark Theme**: Synthwave-inspired dark UI theme

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| Unreleased | 2026-03-13 | ACE-Step 1.5, model updates, rate limiting, full docs |
| 1.3.0 | 2026-01-26 | Mobile responsive design, error handling |
| 1.2.0 | 2026-01-25 | Audio visualizer, onboarding tours, branding |
| 1.1.0 | 2026-01-24 | Gemini AI, Stable Audio, Music Studio, Bark vocals |
| 1.0.0 | 2026-01-23 | Initial release with core features |
