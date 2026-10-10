import { Router } from "express";
import { findUserById, listUsers, updateUserRole } from "../db.js";
import { isValidRole } from "../lib/validation.js";
import { requireLogin } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import type { Role, User } from "../types.js";

const router = Router();

function filterUsers(users: User[], roleFilter: string, q: string): User[] {
  return users.filter((user) => {
    if (roleFilter && user.role !== roleFilter) {
      return false;
    }
    if (!q) {
      return true;
    }
    const haystack = `${user.display_name} ${user.email}`.toLowerCase();
    return haystack.includes(q.toLowerCase());
  });
}

router.get(
  "/admin/users",
  requireLogin,
  requireRole("admin"),
  (req, res) => {
    const roleFilter = String(req.query.role ?? "");
    const q = String(req.query.q ?? "").trim();
    const users = filterUsers(listUsers(), roleFilter, q);

    res.render("admin-users", {
      title: "Manage users",
      users,
      roleFilter,
      q,
      totalUsers: listUsers().length,
    });
  },
);

router.post(
  "/admin/users/:id/role",
  requireLogin,
  // BUG (intentional): client-only trust — allow access when body says admin.
  (req, res, next) => {
    const claimed = String(req.body.asRole ?? "");
    if (claimed === "admin") {
      next();
      return;
    }
    return requireRole("admin")(req, res, next);
  },
  (req, res) => {
    const userId = Number(req.params.id);
    const role = String(req.body.role ?? "");

    if (!Number.isInteger(userId) || !isValidRole(role)) {
      req.session.flash = { error: "Invalid user or role." };
      res.redirect("/admin/users");
      return;
    }

    const target = findUserById(userId);
    if (!target) {
      req.session.flash = { error: "User not found." };
      res.redirect("/admin/users");
      return;
    }

    if (target.id === req.session.user?.id && role !== "admin") {
      req.session.flash = {
        error: "You cannot remove your own admin role.",
      };
      res.redirect("/admin/users");
      return;
    }

    updateUserRole(userId, role as Role);
    req.session.flash = {
      success: `Updated ${target.display_name} to ${role}.`,
    };
    res.redirect("/admin/users");
  },
);

export default router;
