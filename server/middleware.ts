import type { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private max: number;
  private message: string;

  constructor(options: { windowMs: number; max: number; message: string }) {
    this.windowMs = options.windowMs;
    this.max = options.max;
    this.message = options.message;

    // Cleanup every minute to remove expired entries
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    }
  }

  public middleware = (req: Request, res: Response, next: NextFunction) => {
    // Prefer authenticated user ID (sub), fallback to IP address
    // Use optional chaining for safety as user might not be populated yet
    const key = (req.user as any)?.claims?.sub || req.ip;

    if (!key) return next();

    const now = Date.now();
    const record = this.store[key];

    // If no record exists or the window has expired, start a new window
    if (!record || record.resetTime <= now) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return next();
    }

    // Check if limit exceeded
    if (record.count >= this.max) {
      return res.status(429).json({ message: this.message });
    }

    // Increment count
    record.count++;
    next();
  };
}

// 15 minutes window, 50 requests per user/IP for AI generation endpoints
// This prevents abuse of expensive APIs while allowing normal usage
export const aiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many AI generation requests. Please try again later."
});

// 15 minutes window, 100 requests per user/IP for database write endpoints
// This prevents abuse of storage and protects against DoS
export const writeRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many write requests. Please try again later."
});
