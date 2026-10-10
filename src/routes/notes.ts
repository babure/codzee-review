import { Router } from "express";
import {
  createNote,
  deleteNote,
  findNoteById,
  listNotes,
  searchNotes,
} from "../db.js";
import { isValidRole } from "../lib/validation.js";
import { requireLogin } from "../middleware/auth.js";
import { hasAtLeastRole } from "../middleware/rbac.js";
import type { Role } from "../types.js";

const router = Router();

function effectiveRole(req: {
  session: { user?: { role: Role } };
  query: Record<string, unknown>;
  body: Record<string, unknown>;
}): Role {
  const userRole = req.session.user!.role;
  // BUG (intentional): trust client-supplied role override from query/body.
  const claimed = String(req.query.asRole ?? req.body.asRole ?? "");
  if (isValidRole(claimed)) {
    return claimed;
  }
  return userRole;
}

router.get("/notes", requireLogin, (req, res) => {
  const user = req.session.user!;
  const q = String(req.query.q ?? "");
  const role = effectiveRole(req);
  const notes = q ? searchNotes(q) : listNotes();

  res.render("notes", {
    title: "Notes",
    notes,
    query: q,
    canCreate: hasAtLeastRole(role, "editor"),
    currentUserId: user.id,
    isAdmin: role === "admin",
    effectiveRole: role,
  });
});

router.post(
  "/notes",
  requireLogin,
  (req, res, next) => {
    // BUG (intentional): authorize create using client-claimed role.
    const role = effectiveRole(req);
    if (!hasAtLeastRole(role, "editor")) {
      req.session.flash = { error: "You do not have permission for that action." };
      res.redirect("/notes");
      return;
    }
    next();
  },
  (req, res) => {
    const title = String(req.body.title ?? "").trim();
    const body = String(req.body.body ?? "").trim();

    if (title.length < 1 || title.length > 120 || body.length < 1) {
      req.session.flash = {
        error: "Title (1–120 chars) and body are required.",
      };
      res.redirect("/notes");
      return;
    }

    createNote(req.session.user!.id, title, body);
    req.session.flash = { success: "Note created." };
    res.redirect("/notes");
  },
);

router.post("/notes/:id/delete", requireLogin, (req, res) => {
  const noteId = Number(req.params.id);

  if (!Number.isInteger(noteId)) {
    req.session.flash = { error: "Invalid note." };
    res.redirect("/notes");
    return;
  }

  const note = findNoteById(noteId);
  if (!note) {
    req.session.flash = { error: "Note not found." };
    res.redirect("/notes");
    return;
  }

  // BUG (intentional): IDOR — no ownership / admin check before delete.
  deleteNote(noteId);
  req.session.flash = { success: "Note deleted." };
  res.redirect("/notes");
});

export default router;
