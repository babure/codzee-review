import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import connectSqlite3 from "connect-sqlite3";
import { migrate } from "./db.js";
import { attachUser } from "./middleware/auth.js";
import { ensureCsrfToken, verifyCsrf } from "./middleware/csrf.js";
import { flashMiddleware } from "./middleware/flash.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import notesRoutes from "./routes/notes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLiteStore = connectSqlite3(session);

migrate();

const app = express();
const port = Number(process.env.PORT ?? 3000);
const sessionSecret = process.env.SESSION_SECRET ?? "dev-only-change-me";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(
  session({
    store: new SQLiteStore({
      db: "sessions.db",
      dir: path.join(__dirname, "..", "data"),
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

app.use(attachUser);
app.use(ensureCsrfToken);
app.use(flashMiddleware);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user ?? null;
  next();
});

app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
    return;
  }
  res.render("home", { title: "Codzee Review Lab" });
});

app.use(verifyCsrf);
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(adminRoutes);
app.use(notesRoutes);

app.use((_req, res) => {
  res.status(404).render("home", {
    title: "Not found",
    notFound: true,
  });
});

app.listen(port, () => {
  console.log(`Codzee Review Lab listening on http://localhost:${port}`);
});
