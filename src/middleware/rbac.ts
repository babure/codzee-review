import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types.js";

const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
};

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.session.user;
    if (!user) {
      req.session.flash = { error: "Please log in to continue." };
      res.redirect("/login");
      return;
    }

    if (!allowed.includes(user.role)) {
      req.session.flash = { error: "You do not have permission for that action." };
      res.redirect("/dashboard");
      return;
    }

    next();
  };
}

export function hasAtLeastRole(userRole: Role, minimum: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimum];
}
