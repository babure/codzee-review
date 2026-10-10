import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProfile, updateProfile } from "../db.js";
import { requireLogin } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = Router();

router.get("/profile", requireLogin, (req, res) => {
  const profile = getProfile(req.session.user!.id);
  res.render("profile", {
    title: "Your profile",
    user: req.session.user,
    profile,
  });
});

router.post("/profile", requireLogin, (req, res) => {
  const bio = String(req.body.bio ?? "");
  // BUG (intentional): attacker-controlled filename / path segment.
  const avatarFile = String(req.body.avatarFile ?? "").trim();

  if (avatarFile) {
    const target = path.join(uploadsDir, avatarFile);
    // Write a tiny placeholder so the path is exercised.
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `avatar for ${req.session.user!.email}\n`);
  }

  updateProfile(req.session.user!.id, bio, avatarFile);
  req.session.flash = { success: "Profile updated." };
  res.redirect("/profile");
});

router.get("/uploads/*", requireLogin, (req, res) => {
  const file = String(req.params[0] ?? "");
  // BUG (intentional): path traversal via unsanitized join.
  const absolute = path.join(uploadsDir, file);
  if (!fs.existsSync(absolute)) {
    res.status(404).send("Not found");
    return;
  }
  res.sendFile(absolute);
});

export default router;
