// CORRECT HSTS Implementation
// Merge from PR #23 and PR #30

// In server/index.ts, around line 40-50:

// Security headers middleware
app.use((req, res, next) => {
  // HSTS - only in production over HTTPS
  if (process.env.NODE_ENV === "production" && req.secure) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  
  next();
});
