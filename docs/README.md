# HarmoniQ Documentation

Welcome to the HarmoniQ documentation! This directory contains comprehensive guides for understanding, developing, and deploying the HarmoniQ AI music generation platform.

---

## Documentation Index

### Getting Started
- **[../README.md](../README.md)** - Project overview and quick start guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development setup and guidelines
- **[../\.env.example](../.env.example)** - All environment variables documented

### Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, directory structure, schema, auth flow, deployment
- **[DATABASE.md](./DATABASE.md)** - Table definitions, indexes, cascade rules, migration strategy
- **[adr/](./adr/)** - Architecture Decision Records
  - [001 - Replit Auth OIDC](./adr/001-replit-auth-oidc.md)
  - [002 - Multi-AI Engine Architecture](./adr/002-multi-ai-engine-architecture.md)
  - [003 - Suno Multi-Provider](./adr/003-suno-multi-provider.md)
  - [004 - Drizzle ORM Storage Abstraction](./adr/004-drizzle-orm-storage-abstraction.md)
  - [005 - In-Memory Rate Limiting](./adr/005-in-memory-rate-limiting.md)

### API Reference
- **[API.md](./API.md)** - Complete API endpoint documentation (auth, songs, playlists, likes, generation, theory)

### Product
- **[PRD.md](./PRD.md)** - Product requirements, target users, feature status
- **[ROADMAP.md](./ROADMAP.md)** - Version history and planned features
- **[CHANGELOG.md](./CHANGELOG.md)** - Detailed version changelog

### Operations & Security
- **[RUNBOOK.md](./RUNBOOK.md)** - Operations guide, troubleshooting, incident response
- **[SECURITY.md](./SECURITY.md)** - Security architecture, known vulnerabilities, recommendations
- **[AUDIT-REPORT.md](./AUDIT-REPORT.md)** - Full codebase audit (2026-03-13)

### Production Readiness (Historical)
- **[READINESS_EXECUTIVE_SUMMARY.md](./READINESS_EXECUTIVE_SUMMARY.md)** - Readiness verdict and findings
- **[PRODUCTION_READINESS_AUDIT.md](./PRODUCTION_READINESS_AUDIT.md)** - Production audit (25/50 score)
- **[READINESS_ACTION_TRACKER.md](./READINESS_ACTION_TRACKER.md)** - Implementation checklist
- **[PHASE1_QUICK_START.md](./PHASE1_QUICK_START.md)** - Critical fixes guide

### Beta Testing (Historical)
- **[BETA_EXECUTIVE_SUMMARY.md](./BETA_EXECUTIVE_SUMMARY.md)** - Beta overview and recommendations
- **[BETA_TESTING_PLAN.md](./BETA_TESTING_PLAN.md)** - 3-phase beta testing strategy
- **[BETA_CHECKLIST.md](./BETA_CHECKLIST.md)** - Pre-launch checklist

### Code Quality
- **[DEAD-CODE-TRIAGE.md](./DEAD-CODE-TRIAGE.md)** - Dead code analysis (15 candidates)

---

## Quick Navigation

### "How do I set up the project?"
Read the [root README](../README.md) and copy [.env.example](../.env.example)

### "How does the system work?"
Start with [ARCHITECTURE.md](./ARCHITECTURE.md), then [DATABASE.md](./DATABASE.md)

### "What API endpoints are available?"
See [API.md](./API.md)

### "What's the current state of the code?"
See [AUDIT-REPORT.md](./AUDIT-REPORT.md) for the latest audit

### "What's planned next?"
See [ROADMAP.md](./ROADMAP.md) and [PRD.md](./PRD.md)
