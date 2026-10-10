import { Router } from "express";
import { createUser, findUserByEmail } from "../db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  isValidDisplayName,
  isValidEmail,
  isValidPassword,
} from "../lib/validation.js";
import { requireLogin } from "../middleware/auth.js";

const router = Router();

router.get("/register", (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
    return;
  }
  res.render("register", { title: "Register" });
});

router.post("/register", (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const displayName = String(req.body.displayName ?? "").trim();
  const password = String(req.body.password ?? "");

  if (!isValidEmail(email)) {
    req.session.flash = { error: "Enter a valid email address." };
    res.redirect("/register");
    return;
  }

  if (!isValidDisplayName(displayName)) {
    req.session.flash = { error: "Display name must be 2–80 characters." };
    res.redirect("/register");
    return;
  }

  if (!isValidPassword(password)) {
    req.session.flash = { error: "Password must be at least 8 characters." };
    res.redirect("/register");
    return;
  }

  if (findUserByEmail(email)) {
    req.session.flash = { error: "An account with that email already exists." };
    res.redirect("/register");
    return;
  }

  const user = createUser(email, displayName, hashPassword(password), "viewer");

  req.session.regenerate((err) => {
    if (err) {
      req.session.flash = { error: "Could not start a session. Try again." };
      res.redirect("/login");
      return;
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    };
    req.session.flash = { success: "Welcome! Your account was created." };
    res.redirect("/dashboard");
  });
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
    return;
  }
  res.render("login", { title: "Log in" });
});

router.post("/login", (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    req.session.flash = { error: "Invalid email or password." };
    res.redirect("/login");
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      req.session.flash = { error: "Could not start a session. Try again." };
      res.redirect("/login");
      return;
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    };
    req.session.flash = { success: `Signed in as ${user.display_name}.` };
    res.redirect("/dashboard");
  });
});

router.post("/logout", requireLogin, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

export default router;
