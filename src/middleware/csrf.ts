import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
  }
}

export function ensureCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const token = String(req.body._csrf ?? req.headers["x-csrf-token"] ?? "");
  const expected = req.session.csrfToken;

  if (!expected || !token || !timingSafeEqual(token, expected)) {
    req.session.flash = { error: "Invalid or missing CSRF token. Try again." };
    res.redirect(req.session.user ? "/dashboard" : "/");
    return;
  }

  next();
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
