# Tasks (initial backlog)

Decomposed from `plan.md`. Each task fits one agent session and is as independent
as possible. The first task is an empty project with a passing test.

> After the backlog was trimmed to the MVP, every task below was moved to a GitHub
> issue. **GitHub issues are now the only active backlog — this file is no longer used.**

## 1. Project skeleton
Goal: empty backend and frontend projects that start and have one passing test each.
Description: FastAPI app with `GET /api/health`, pytest test; Vite + React + TS app with Tailwind and Motion installed, one Vitest test. Commands documented in AGENTS.md.

## 2. Accounts: sign up, log in, log out
Goal: a student can create an account with email + password and get a session token.
Description: users and sessions tables, hashed passwords, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

## 3. Groups: create, join by code, list
Goal: a student can create groups, join others with an invite code and see their groups.
Description: groups and memberships tables, 6-character invite code, creator is owner. Permission helpers in `permissions.py`.

## 4. Deadlines API
Goal: members add deadlines to a group; author or owner edits/deletes them.
Description: deadlines table (title, course, due_at, description, author), CRUD endpoints, list split into upcoming and past.

## 5. Personal done status
Goal: each student marks a deadline done only for themselves.
Description: completions table, `PUT/DELETE /api/deadlines/{id}/done`, lists include `done` for the current user.

## 6. Frontend: auth screens
Goal: sign up and log in from the browser; token kept between reloads.
Description: animated login/register card, API client with bearer token, logout.

## 7. Frontend: groups
Goal: create a group, join with a code, switch between groups.
Description: sidebar/tabs with groups, copyable invite code, "All my groups" view.

## 8. Frontend: animated deadline cards
Goal: the main screen — cards with live countdowns, urgency colours, add/edit form, done with confetti, past section.
Description: Motion layout animations, `AnimatePresence`, countdown hook, canvas-confetti.

## Later (not MVP)
- Email/push reminders before a deadline.
- Import deadlines from Moodle.
- Deadline types/weights, attachments, comments.
