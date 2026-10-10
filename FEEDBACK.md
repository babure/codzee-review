# Codzee Review Experience — Feedback Draft

Use this document while evaluating Codzee on [babure/codzee-review](https://github.com/babure/codzee-review), then paste/adapt answers into the Codzee Google Form.

**Deadline:** Monday, 12 October 2026

## Manual steps you must complete

1. Sign in at [https://www.codzee.io](https://www.codzee.io) with GitHub.
2. Install Codzee on **`babure/codzee-review`** (public repo).
3. Wait for Codzee to review these open PRs:
   - [#1 Baseline MVP](https://github.com/babure/codzee-review/pull/1) (clean baseline — expect few/no security findings)
   - [#2 Auth / remember-me](https://github.com/babure/codzee-review/pull/2)
   - [#3 Notes search + RBAC](https://github.com/babure/codzee-review/pull/3)
   - [#4 Profile / preview / redirects](https://github.com/babure/codzee-review/pull/4)
4. Explore dashboard + “Ask Codzee” if available on your plan.
5. Fill the Google Form with repo URL + feedback from this file.
6. Keep the repository and PRs **public**.

## Repo / contact fields (for the form)

| Field | Value |
|-------|-------|
| Name | Babu Reddy S |
| Email | _(your email)_ |
| Phone | _(your phone)_ |
| GitHub repository URL | https://github.com/babure/codzee-review |

## Planted issues checklist (ground truth)

Fill **Caught?** after Codzee comments. Mark `Y` / `N` / `Partial`.

### PR #2 — Auth / sessions (`cursor/pr1-auth-session-bugs-c577`)

| # | Planted issue | Location | Caught? | Notes |
|---|---------------|----------|---------|-------|
| A1 | User enumeration via distinct login errors | `src/routes/auth.ts` | | |
| A2 | Session fixation (no `regenerate` on login) | `src/routes/auth.ts` | | |
| A3 | Weak/predictable remember-me token | `src/lib/rememberMe.ts` | | |
| A4 | Remember-me cookie not HttpOnly | `src/routes/auth.ts` | | |
| A5 | Logs password + remember token | `src/routes/auth.ts` | | |

### PR #3 — Notes / RBAC (`cursor/pr2-notes-rbac-bugs-c577`)

| # | Planted issue | Location | Caught? | Notes |
|---|---------------|----------|---------|-------|
| B1 | SQL injection in note search | `src/db.ts` `searchNotes` | | |
| B2 | IDOR: delete note without ownership check | `src/routes/notes.ts` | | |
| B3 | Client-claimed `asRole` privilege escalation | `src/routes/notes.ts` | | |
| B4 | Mass assignment: register accepts `role=admin` | `src/routes/auth.ts` | | |
| B5 | Admin role POST trusts `asRole=admin` body | `src/routes/admin.ts` | | |

### PR #4 — Profile / XSS / CSRF (`cursor/pr3-profile-xss-csrf-c577`)

| # | Planted issue | Location | Caught? | Notes |
|---|---------------|----------|---------|-------|
| C1 | Stored XSS via unescaped bio (`<%-`) | `views/profile.ejs` | | |
| C2 | Stored XSS via unescaped note title/body | `views/note-preview.ejs` | | |
| C3 | CSRF skipped on `POST /profile` | `src/middleware/csrf.ts` | | |
| C4 | Authz inconsistency: UI hides delete, POST allows any user | `src/routes/notes.ts` | | |
| C5 | Path traversal in `/uploads/*` | `src/routes/profile.ts` | | |
| C6 | Open redirect via login `next` | `src/routes/auth.ts` | | |

## Capability matrix (from Codzee product claims)

| Capability | How tested | Result | Observations |
|------------|------------|--------|--------------|
| Real bugs + suggested fix | IDOR, authz bugs | | |
| Security risks | SQLi, XSS, session, CSRF | | |
| Signal vs noise | Clean baseline PR #1 | | |
| Confidence / incomplete review | Multi-file PRs | | |
| Reviewer routing | N/A unless 2nd collaborator | | |
| Team dashboard | After ≥1 reviewed PR | | |
| Ask Codzee | Ask about auth risks in repo | | |
| Learning from dismiss | Dismiss a false positive; open similar later | | |

## Feedback prompts (draft answers here)

### What did you like about the review experience?

_

### What worked particularly well?

_

### What could be improved?

_

### Bugs, inconsistencies, or confusing behaviour?

_

### Issues or scenarios Codzee missed?

_(compare against planted checklist above)_

### Were the reviews accurate and useful?

_

### Features or improvements you would suggest?

_

### How would you improve the overall developer experience?

_

## Additional observations for Codzee

- App stack: Node.js + Express + TypeScript + SQLite + EJS
- Baseline on `main` is intentionally **secure**; evaluation defects live only in open PRs #2–#4
- Goal was to probe security + authorization review quality with realistic feature diffs

## Local run (optional)

```bash
cp .env.example .env
npm install
npm run dev
```

Seed admin: `admin@example.com` / `Admin123!`
