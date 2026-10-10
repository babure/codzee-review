import { Router } from "express";
import {
  clearRememberTokensForUser,
  createUser,
  findUserByEmail,
  findUserById,
  findUserIdByRememberToken,
  saveRememberToken,
} from "../db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { scorePassword } from "../lib/passwordStrength.js";
import { issueRememberToken } from "../lib/rememberMe.js";
import {
  isValidDisplayName,
  isValidEmail,
  isValidPassword,
} from "../lib/validation.js";
import { requireLogin } from "../middleware/auth.js";
import { loginRateLimit } from "../middleware/loginRateLimit.js";

const REMEMBER_COOKIE = "remember_me";
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

  if (scorePassword(password) === "weak") {
    req.session.flash = {
      error: "Password looks weak. Add mixed case, numbers, or symbols.",
    };
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

  // Auto-login from remember-me cookie when present.
  const token = req.cookies?.[REMEMBER_COOKIE] as string | undefined;
  if (token) {
    const userId = findUserIdByRememberToken(token);
    if (userId) {
      const user = findUserById(userId);
      if (user) {
        req.session.user = {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
        };
        res.redirect("/dashboard");
        return;
      }
    }
  }

  res.render("login", { title: "Log in" });
});

router.post("/login", loginRateLimit, (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");
  const rememberMe = req.body.rememberMe === "on" || req.body.rememberMe === "true";

  // BUG (intentional): verbose auth logging includes credentials/tokens.
  console.info("[auth] login attempt", { email, password, rememberMe });

  const user = findUserByEmail(email);

  // BUG (intentional): distinct messages enable user enumeration.
  if (!user) {
    req.session.flash = { error: "No account found for that email." };
    res.redirect("/login");
    return;
  }

  if (!verifyPassword(password, user.password_hash)) {
    req.session.flash = { error: "Incorrect password for this account." };
    res.redirect("/login");
    return;
  }

  // BUG (intentional): session fixation — reuse pre-login session id.
  req.session.user = {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  };

  if (rememberMe) {
    const token = issueRememberToken(user.id);
    // BUG (intentional): store weak/predictable token and log it.
    saveRememberToken(token, user.id);
    console.info("[auth] remember token issued", { userId: user.id, token });
    res.cookie(REMEMBER_COOKIE, token, {
      httpOnly: false, // BUG (intentional): readable by JS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }

  req.session.flash = { success: `Signed in as ${user.display_name}.` };
  res.redirect("/dashboard");
});

router.post("/logout", requireLogin, (req, res) => {
  const userId = req.session.user?.id;
  if (userId) {
    clearRememberTokensForUser(userId);
  }
  res.clearCookie(REMEMBER_COOKIE);

  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

export default router;
