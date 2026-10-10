import type { NextFunction, Request, Response } from "express";

interface AttemptBucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 20;
const buckets = new Map<string, AttemptBucket>();

/** Lightweight in-memory login rate limiter (best-effort for demo). */
export function loginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  bucket.count += 1;
  if (bucket.count > MAX_ATTEMPTS) {
    req.session.flash = {
      error: "Too many login attempts. Please wait a minute and try again.",
    };
    res.redirect("/login");
    return;
  }

  next();
}
