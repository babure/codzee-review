import { Router } from "express";
import {
  createNote,
  deleteNote,
  findNoteById,
  listNotes,
  searchNotes,
} from "../db.js";
import { bodyString, paramId, queryString } from "../lib/request.js";
import { requireLogin } from "../middleware/auth.js";
import { hasAtLeastRole, requireRole } from "../middleware/rbac.js";

const router = Router();

router.get("/notes", requireLogin, (req, res) => {
  const user = req.session.user!;
  const q = queryString(req, "q");
  const notes = q ? searchNotes(q) : listNotes();

  res.render("notes", {
    title: "Notes",
    notes,
    query: q,
    canCreate: hasAtLeastRole(user.role, "editor"),
    currentUserId: user.id,
    isAdmin: user.role === "admin",
  });
});

router.get("/notes/:id", requireLogin, (req, res) => {
  const noteId = paramId(req, "id");
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
    const title = bodyString(req, "title").trim();
    const body = bodyString(req, "body").trim();

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
  const noteId = paramId(req, "id");
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
