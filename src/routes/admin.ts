import { Router } from "express";
import { findUserById, listUsers, updateUserRole } from "../db.js";
import { isValidRole } from "../lib/validation.js";
import { requireLogin } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.get(
  "/admin/users",
  requireLogin,
  requireRole("admin"),
  (_req, res) => {
    res.render("admin-users", {
      title: "Manage users",
      users: listUsers(),
    });
  },
);

router.post(
  "/admin/users/:id/role",
  requireLogin,
  requireRole("admin"),
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

    updateUserRole(userId, role);
    req.session.flash = {
      success: `Updated ${target.display_name} to ${role}.`,
    };
    res.redirect("/admin/users");
  },
);

export default router;
