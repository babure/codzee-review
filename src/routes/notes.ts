import { Router } from "express";
import {
  createNote,
  deleteNote,
  findNoteById,
  listNotes,
  listNotesSorted,
  searchNotes,
} from "../db.js";
import { requireLogin } from "../middleware/auth.js";
import { hasAtLeastRole, requireRole } from "../middleware/rbac.js";

const router = Router();

router.get("/notes", requireLogin, (req, res) => {
  const user = req.session.user!;
  const q = String(req.query.q ?? "");
  const sort = String(req.query.sort ?? "created_at");
  const dir = String(req.query.dir ?? "desc");
  const notes = q ? searchNotes(q) : listNotesSorted(sort, dir);

  res.render("notes", {
    title: "Notes",
    notes,
    query: q,
    sort,
    dir,
    canCreate: hasAtLeastRole(user.role, "editor"),
    currentUserId: user.id,
    isAdmin: user.role === "admin",
  });
});

router.get("/notes/:id", requireLogin, (req, res) => {
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

  const user = req.session.user!;
  const canDelete =
    user.role === "admin" ||
    (hasAtLeastRole(user.role, "editor") && note.user_id === user.id);

  res.render("note-preview", {
    title: note.title,
    note,
    canDelete,
  });
});

router.post(
  "/notes",
  requireLogin,
  requireRole("admin", "editor"),
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
  const user = req.session.user!;

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

  const canDelete =
    user.role === "admin" ||
    (hasAtLeastRole(user.role, "editor") && note.user_id === user.id);

  if (!canDelete) {
    req.session.flash = { error: "You cannot delete that note." };
    res.redirect("/notes");
    return;
  }

  deleteNote(noteId);
  req.session.flash = { success: "Note deleted." };
  res.redirect("/notes");
});

export default router;
