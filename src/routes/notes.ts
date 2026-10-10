import { Router } from "express";
import {
  createNote,
  deleteNote,
  findNoteById,
  findUserByEmail,
  listNotes,
  listNotesByUser,
  searchNotes,
  transferNote,
} from "../db.js";
import { requireLogin } from "../middleware/auth.js";
import { hasAtLeastRole, requireRole } from "../middleware/rbac.js";

const router = Router();

router.get("/notes", requireLogin, (req, res) => {
  const user = req.session.user!;
  const q = String(req.query.q ?? "");
  const mine = req.query.mine === "1";
  const notes = mine
    ? listNotesByUser(user.id)
    : q
      ? searchNotes(q)
      : listNotes();

  res.render("notes", {
    title: "Notes",
    notes,
    query: q,
    mine,
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
  const canTransfer =
    user.role === "admin" ||
    hasAtLeastRole(user.role, "editor") ||
    note.user_id === user.id;

  res.render("note-preview", {
    title: note.title,
    note,
    canDelete,
    canTransfer,
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

router.post("/notes/:id/transfer", requireLogin, (req, res) => {
  const noteId = Number(req.params.id);
  const targetEmail = String(req.body.targetEmail ?? "").trim();
  const user = req.session.user!;

  if (!Number.isInteger(noteId) || !targetEmail) {
    req.session.flash = { error: "Note and target email are required." };
    res.redirect("/notes");
    return;
  }

  const note = findNoteById(noteId);
  if (!note) {
    req.session.flash = { error: "Note not found." };
    res.redirect("/notes");
    return;
  }

  const canTransfer =
    user.role === "admin" ||
    hasAtLeastRole(user.role, "editor") ||
    note.user_id === user.id;

  if (!canTransfer) {
    req.session.flash = { error: "You cannot transfer that note." };
    res.redirect(`/notes/${noteId}`);
    return;
  }

  const target = findUserByEmail(targetEmail);
  if (!target) {
    req.session.flash = { error: "No user found with that email." };
    res.redirect(`/notes/${noteId}`);
    return;
  }

  transferNote(noteId, target.id);
  req.session.flash = {
    success: `Note transferred to ${target.display_name}.`,
  };
  res.redirect("/notes");
});

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
