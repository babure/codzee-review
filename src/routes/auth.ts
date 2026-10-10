import { Router, type Request } from "express";
import {
  clearRememberTokensForUser,
  createUser,
  findUserByEmail,
  findUserById,
  findUserIdByRememberTokenHash,
  saveRememberTokenHash,
} from "../db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { scorePassword } from "../lib/passwordStrength.js";
import { safeInternalPath } from "../lib/redirect.js";
import { hashRememberToken, issueRememberToken } from "../lib/rememberMe.js";
import {
  isValidDisplayName,
  isValidEmail,
  isValidPassword,
} from "../lib/validation.js";
import { requireLogin } from "../middleware/auth.js";
import { loginRateLimit } from "../middleware/loginRateLimit.js";
import type { User } from "../types.js";

const REMEMBER_COOKIE = "remember_me";
const DUMMY_HASH = hashPassword("not-a-real-password-for-timing");
const router = Router();

function setSessionUser(req: Request, user: User): void {
  req.session.user = {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  };
}

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

  if (!isValidPassword(password) || scorePassword(password) === "weak") {
    req.session.flash = {
      error: "Password must be at least 8 characters and not weak.",
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

    setSessionUser(req, user);
    req.session.flash = { success: "Welcome! Your account was created." };
    res.redirect("/dashboard");
  });
});

router.get("/login", loginRateLimit, (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
    return;
  }

  const next = safeInternalPath(String(req.query.next ?? ""), "/dashboard");
  const token = req.cookies?.[REMEMBER_COOKIE] as string | undefined;

  if (token) {
    const userId = findUserIdByRememberTokenHash(hashRememberToken(token));
    if (userId) {
      const user = findUserById(userId);
      if (user) {
        req.session.regenerate((err) => {
          if (err) {
            res.render("login", { title: "Log in", next });
            return;
          }
          setSessionUser(req, user);
          res.redirect(next);
        });
        return;
      }
    }
  }

  res.render("login", { title: "Log in", next });
});

router.post("/login", loginRateLimit, (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");
  const rememberMe =
    req.body.rememberMe === "on" || req.body.rememberMe === "true";
  const next = safeInternalPath(String(req.body.next ?? ""), "/dashboard");

  const user = findUserByEmail(email);
  const passwordOk = verifyPassword(
    password,
    user?.password_hash ?? DUMMY_HASH,
  );

  if (!user || !passwordOk) {
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

    setSessionUser(req, user);

    if (rememberMe) {
      const token = issueRememberToken();
      saveRememberTokenHash(hashRememberToken(token), user.id);
      res.cookie(REMEMBER_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });
    }

    req.session.flash = { success: `Signed in as ${user.display_name}.` };
    res.redirect(next);
  });
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
