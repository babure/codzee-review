import type { NextFunction, Request, Response } from "express";

export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  req.user = req.session.user;
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
