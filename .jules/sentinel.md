# Sentinel's Journal

## 2025-02-14 - Exposed Sensitive Data in Logs
**Vulnerability:** The custom logging middleware in `server/index.ts` was logging the full JSON body of every API response, including `/api/auth/user` which returns PII (email, names) and potential tokens.
**Learning:** Custom logging implementations often miss standard security features like sanitization that established libraries might offer or document more clearly.
**Prevention:** Implement response body sanitization at the middleware level, redacting keys matching sensitive patterns (password, email, token) before logging.

## 2026-02-09 - Missing Authentication on Integration Routes
**Vulnerability:** Integration modules (Chat, Image Generation) defined in `server/replit_integrations/` exported route registration functions that did not enforce authentication. These routes were exposed publicly, allowing unauthenticated users to consume paid AI resources and access chat history.
**Learning:** When splitting route definitions into multiple modules/files, it is easy to assume that authentication is handled globally or to forget to apply it to the new module.
**Prevention:** Always verify authentication middleware is applied to *all* API routes, preferably by applying it to the entire router path (e.g., `app.use("/api/integrations", isAuthenticated)`) before registering sub-routes.
