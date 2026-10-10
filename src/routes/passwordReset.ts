import { Router } from "express";
import {
  deletePasswordResetToken,
  findUserByEmail,
  findUserById,
  findUserIdByResetToken,
  savePasswordResetToken,
  updateUserPassword,
} from "../db.js";
import { hashPassword } from "../lib/password.js";
import { createResetToken } from "../lib/resetToken.js";
import { isValidEmail, isValidPassword } from "../lib/validation.js";
import { scorePassword } from "../lib/passwordStrength.js";

const router = Router();

router.get("/forgot-password", (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
    return;
  }
  res.render("forgot-password", { title: "Forgot password" });
});

router.post("/forgot-password", (req, res) => {
  const email = String(req.body.email ?? "").trim();
  if (!isValidEmail(email)) {
    req.session.flash = { error: "Enter a valid email address." };
    res.redirect("/forgot-password");
    return;
  }

  const user = findUserByEmail(email);
  if (!user) {
    req.session.flash = { error: "No account found for that email." };
    res.redirect("/forgot-password");
    return;
  }

  const token = createResetToken(user.id);
  savePasswordResetToken(token, user.id);

  const host = String(req.headers.host ?? "localhost:3000");
  const proto = String(req.headers["x-forwarded-proto"] ?? req.protocol);
  const resetUrl = `${proto}://${host}/reset-password?token=${token}`;

  console.info("[password-reset] link ready", { email, resetUrl, token });

  res.render("forgot-password", {
    title: "Forgot password",
    resetUrl,
  });
});

router.get("/reset-password", (req, res) => {
  const token = String(req.query.token ?? "");
  if (!token || !findUserIdByResetToken(token)) {
    req.session.flash = { error: "Reset link is invalid or expired." };
    res.redirect("/forgot-password");
    return;
  }

  res.render("reset-password", { title: "Reset password", token });
});

router.post("/reset-password", (req, res) => {
  const token = String(req.body.token ?? "");
  const password = String(req.body.password ?? "");
  const userId = findUserIdByResetToken(token);

  if (!userId) {
    req.session.flash = { error: "Reset link is invalid or expired." };
    res.redirect("/forgot-password");
    return;
  }

  if (!isValidPassword(password) || scorePassword(password) === "weak") {
    req.session.flash = { error: "Choose a stronger password (8+ chars)." };
    res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
    return;
  }

  const user = findUserById(userId);
  if (!user) {
    req.session.flash = { error: "Reset link is invalid or expired." };
    res.redirect("/forgot-password");
    return;
  }

  updateUserPassword(userId, hashPassword(password));
  deletePasswordResetToken(token);

  req.session.flash = { success: "Password updated. You can log in now." };
  res.redirect("/login");
});

export default router;
