# Decisions

Architecture and stack decisions taken after the brainstorm. The agent was asked
for stack options with tradeoffs (no code yet), and one was chosen.

## Stack options considered

| Option | Pros | Cons |
|---|---|---|
| A. React + Vite + Motion frontend, FastAPI + SQLite backend | Best animation library (Motion: layout animations, spring physics, `AnimatePresence`); FastAPI is small, typed, easy to test with pytest | Two runtimes (Node + Python) |
| B. Django full-stack + HTMX | One runtime, batteries included | Animations limited to CSS; heavier for a small API |
| C. Next.js full-stack (API routes + SQLite) | One language | More framework magic; auth/DB setup heavier for an MVP |

**Chosen: A** — the student asked for "the strongest animations", so the
frontend is React + Motion; the backend stays a thin JSON API.

## Decisions

1. **Monorepo**: `backend/` (Python, FastAPI) and `frontend/` (React, TypeScript, Vite).
2. **Database**: SQLite through Python's built-in `sqlite3`. One file, `deadline_squad.db`; tests use a temporary file.
3. **Auth**: email + password. Passwords hashed with `hashlib.pbkdf2_hmac` (SHA-256, random salt). Login returns a random bearer token stored in a `sessions` table. No JWT, no new auth library.
4. **Authorization** lives in one module: `backend/app/permissions.py`. No second permissions module.
5. **Times**: due dates stored as UTC ISO-8601 strings; the frontend shows local time.
6. **Done status** is a separate table `completions(user_id, deadline_id)` — personal per user, never shared.
7. **Frontend styling**: Tailwind CSS. **Animations**: `motion` (Framer Motion) + `canvas-confetti`.
8. **Tests**: backend `pytest` + FastAPI `TestClient`; frontend `vitest` + Testing Library.
9. **Frontend talks to the backend** through `/api/*`; Vite dev server proxies `/api` to `http://localhost:8000`.
