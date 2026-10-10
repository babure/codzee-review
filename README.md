# Codzee Review Lab

Simple **registration / login / RBAC** web app used to evaluate [Codzee](https://www.codzee.io) pull-request reviews for a technical interview exercise.

Stack: **Node.js + Express + TypeScript + SQLite + EJS**.

## Features

- Email/password registration and login
- Session cookies (HttpOnly) with SQLite session store
- CSRF protection on mutating requests
- Roles: `admin`, `editor`, `viewer`
- Notes board with role-based create/delete
- Admin page to change user roles

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed admin

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@example.com` |
| Password | `Admin123!`         |

Created automatically on first boot.

## RBAC

| Role   | Capabilities                                      |
|--------|---------------------------------------------------|
| viewer | Read dashboard and notes                          |
| editor | Create notes; delete own notes                    |
| admin  | Manage roles; delete any note                     |

New registrations start as `viewer`. Promote users from **Admin → Manage users**.

## Project layout

See `src/` for server, DB, middleware, and routes; `views/` for templates; `public/` for CSS.

## Auth extras

- Password strength hint on registration
- In-memory login rate limiting (best-effort)
- Optional “Remember me” cookie for 30 days

## Codzee evaluation workflow

1. Install Codzee on this public repository from [codzee.io](https://www.codzee.io).
2. Open the intentional evaluation PRs (auth, RBAC, XSS/CSRF scenarios).
3. Record findings in [`FEEDBACK.md`](./FEEDBACK.md).
4. Submit the Codzee Google Form with the repo URL and your feedback.

## Scripts

| Command           | Description                |
|-------------------|----------------------------|
| `npm run dev`     | Dev server with reload     |
| `npm start`       | Start server               |
| `npm run typecheck` | TypeScript check         |

## Disclaimer

This app is a **review sandbox**, not a production service. Seed credentials are for local demo only.
