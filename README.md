# Deadline Squad

Shared deadline tracker for study groups: every member adds deadlines once, the whole group sees them as animated cards with a live countdown, and each student marks them done for themselves.

Built with an **AI-native workflow**:

1. `chat-brainstorm.md` — the chat brainstorm (one question at a time).
2. `_docs/plan.md` — the spec saved from the brainstorm.
3. `_docs/decisions.md` — stack options and choices.
4. `_docs/tasks.md` — initial backlog, then moved to **GitHub issues** (the only backlog).
5. `AGENTS.md` / `CLAUDE.md` — agent context; `_docs/process.md` — orchestrator + roles (`_docs/team/pm.md`, `software-engineer.md`, `qa-engineer.md`); `_docs/task-template.md` — groomed issue template.
6. Every issue goes **PM grooming → Engineer implementation → QA PASS/FAIL → close**.

## Run

```bash
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Tests: `cd backend && uv run pytest` · `cd frontend && npm test`
