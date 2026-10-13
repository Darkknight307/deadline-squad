# AGENTS.md

Context for coding agents. Read this at the start of every session.

Deadline Squad — a shared deadline tracker for study groups.
Monorepo: `backend/` (Python 3.12, FastAPI, SQLite) and `frontend/` (React, TypeScript, Vite, Tailwind, Motion).

## Commands

Backend (run from `backend/`):
- Install dependencies: `uv sync`
- Run the server: `uv run uvicorn app.main:app --reload --port 8000`
- Run all tests: `uv run pytest`
- Run one test file: `uv run pytest tests/test_auth.py`

Frontend (run from `frontend/`):
- Install dependencies: `npm install`
- Dev server (proxies `/api` to port 8000): `npm run dev`
- Run all tests: `npm test`
- Run one test file: `npx vitest run src/lib/countdown.test.ts`
- Type check + build: `npm run build`

## Rules

- Python dependencies are added only in `backend/pyproject.toml` (via `uv add`); JS dependencies only in `frontend/package.json`. **Never add a dependency without asking.**
- Authorization checks go only through `backend/app/permissions.py`.
- Work on one GitHub issue at a time. Read its acceptance criteria before starting and before closing.
- Commit regularly; reference the issue number in commit messages (`(#4)`).
- Every change ships with tests; `uv run pytest` and `npm test` must pass.

## Documents

- `_docs/process.md` — how work is organised (issues, roles, orchestrator). **Read before picking up any issue.**
- `_docs/task-template.md` — the structure every groomed issue follows.
- `_docs/team/pm.md`, `_docs/team/software-engineer.md`, `_docs/team/qa-engineer.md` — role instructions; read the one for the role you are playing.
- `_docs/plan.md` — the product spec from the brainstorm. Read when a requirement is unclear.
- `_docs/decisions.md` — stack and architecture decisions. Read before adding files, tables or libraries.
- `_docs/testing-guidelines.md` — how to write tests. Read when writing or reviewing tests.
- `_docs/api.md` — the HTTP API. Read when touching backend endpoints or the frontend API client.
