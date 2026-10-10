import type { NextFunction, Request, Response } from "express";
import { findUserById } from "../db.js";

/**
 * Attach the session user and keep display fields fresh from the database.
 * This runs on every request so renamed accounts / email edits show up without
 * forcing a full re-login.
 */
export function attachUser(req: Request, res: Response, next: NextFunction): void {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    next();
    return;
  }

  const fresh = findUserById(sessionUser.id);
  if (!fresh) {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    });
    return;
  }

  sessionUser.email = fresh.email;
  sessionUser.displayName = fresh.display_name;
  req.user = sessionUser;
  next();
}

export function requireLogin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    req.session.flash = { error: "Please log in to continue." };
    res.redirect("/login");
    return;
  }
  next();
}
