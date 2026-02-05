import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Cache headers middleware for optimal caching
  const cacheHeaders = (maxAge: number, immutable = false) => {
    return (_req: Request, res: Response, next: NextFunction) => {
      const cacheControl = immutable 
        ? `public, max-age=${maxAge}, immutable`
        : `public, max-age=${maxAge}`;
      res.setHeader('Cache-Control', cacheControl);
      next();
    };
  };

  // Hashed assets (JS, CSS with hash in filename) - cache for 1 year, immutable
  app.use('/assets', cacheHeaders(31536000, true), express.static(path.join(distPath, 'assets')));
  
  // Service worker - no cache to ensure updates are picked up immediately
  app.get('/sw.js', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(distPath, 'sw.js'));
  });

  // Manifest - short cache (1 hour) to pick up theme updates
  app.get('/manifest.json', cacheHeaders(3600), (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'manifest.json'));
  });

  // Icons and images - cache for 1 day
  app.use('/icons', cacheHeaders(86400), express.static(path.join(distPath, 'icons')));
  
  // Favicon - cache for 1 week
  app.get('/favicon.png', cacheHeaders(604800), (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'favicon.png'));
  });

  // HTML files - no cache to ensure updates are immediate
  app.get(['/', '/index.html'], (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Default static files - cache for 1 hour (non-HTML assets)
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("/{*path}", (_req, res) => {
    // HTML pages should not be cached aggressively
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
