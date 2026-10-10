import type { NextFunction, Request, Response } from "express";

export function flashMiddleware(req: Request, res: Response, next: NextFunction): void {
  const flash = req.session.flash;
  res.locals.flash = flash ?? null;
  delete req.session.flash;
  next();
}
