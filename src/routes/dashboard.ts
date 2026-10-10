import { Router } from "express";
import { requireLogin } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard", requireLogin, (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    user: req.session.user,
  });
});

export default router;
