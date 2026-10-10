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

const MAX_BIO_LENGTH = 500;

function safeAvatarName(input: string): string | null {
  const base = path.basename(input.trim());
  if (!base || base === "." || base === "..") {
    return null;
  }
  if (!/^[A-Za-z0-9._-]+$/.test(base)) {
    return null;
  }
  return base;
}

function resolveUploadPath(fileName: string): string | null {
  const absolute = path.resolve(uploadsDir, fileName);
  const root = path.resolve(uploadsDir) + path.sep;
  if (!absolute.startsWith(root) && absolute !== path.resolve(uploadsDir)) {
    return null;
  }
  return absolute;
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
  const bio = String(req.body.bio ?? "").slice(0, MAX_BIO_LENGTH);
  const rawAvatar = String(req.body.avatarFile ?? "").trim();
  let avatarFile = "";

  if (rawAvatar) {
    const safeName = safeAvatarName(rawAvatar);
    if (!safeName) {
      req.session.flash = { error: "Avatar filename is invalid." };
      res.redirect("/profile");
      return;
    }

    const target = resolveUploadPath(safeName);
    if (!target) {
      req.session.flash = { error: "Avatar filename is invalid." };
      res.redirect("/profile");
      return;
    }

    fs.writeFileSync(target, `avatar for ${req.session.user!.email}\n`);
    avatarFile = safeName;
  } else {
    avatarFile = getProfile(req.session.user!.id).avatar_file;
  }

  updateProfile(req.session.user!.id, bio, avatarFile);
  req.session.flash = { success: "Profile updated." };
  res.redirect("/profile");
});

router.get("/uploads/:file", requireLogin, (req, res) => {
  const safeName = safeAvatarName(String(req.params.file ?? ""));
  if (!safeName) {
    res.status(404).send("Not found");
    return;
  }

  const absolute = resolveUploadPath(safeName);
  if (!absolute || !fs.existsSync(absolute)) {
    res.status(404).send("Not found");
    return;
  }

  res.sendFile(absolute);
});

export default router;
