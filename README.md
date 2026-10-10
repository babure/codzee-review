# Codzee Review Lab

Simple **registration / login / RBAC** web app used to evaluate [Codzee](https://www.codzee.io) pull-request reviews.

Stack: **Node.js + Express + TypeScript + SQLite + EJS**.

## Features

- Email/password registration and login
- Session cookies (HttpOnly) with SQLite session store
- CSRF protection on mutating requests
- Password strength hints + login rate limiting
- Optional remember-me (hashed token, HttpOnly cookie)
- Roles: `admin`, `editor`, `viewer`
- Notes board with search, preview, and role-based create/delete
- Profile page (bio + avatar filename)
- Admin page to filter users and change roles
- Session profile sync (display name / email refreshed from DB each request)
- Role changes clear remember-me tokens for the affected user

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

| Role   | Capabilities                   |
|--------|--------------------------------|
| viewer | Read dashboard and notes       |
| editor | Create notes; delete own notes |
| admin  | Manage roles; delete any note  |

New registrations always start as `viewer`. Promote users from **Admin → Manage users**.

## Project layout

See `src/` for server, DB, middleware, and routes; `views/` for templates; `public/` for CSS.

## Scripts

| Command             | Description            |
|---------------------|------------------------|
| `npm run dev`       | Dev server with reload |
| `npm start`         | Start server           |
| `npm run typecheck` | TypeScript check       |

## Disclaimer

This app is a **review sandbox**, not a production service. Seed credentials are for local demo only.
