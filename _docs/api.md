# HTTP API

All endpoints are under `/api`. Authenticated endpoints need `Authorization: Bearer <token>`
(missing/unknown token → `401`). Errors are JSON `{"detail": "..."}`; validation errors are `422`.

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | `{"status": "ok"}` |

## Auth (#2)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | – | `{email, password}` (password ≥ 8) | `201 {token, user: {id, email}}`; `409` email taken; `422` invalid |
| POST | `/api/auth/login` | – | `{email, password}` | `200 {token, user}`; `401 "Invalid email or password"` |
| GET | `/api/auth/me` | ✓ | – | `200 {id, email}` |
| POST | `/api/auth/logout` | ✓ | – | `204`; the token stops working |

Emails are trimmed and lower-cased.

## Groups (#3)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/groups` | ✓ | `{name}` (1–60 chars) | `201 {id, name, invite_code, is_owner, member_count}` |
| POST | `/api/groups/join` | ✓ | `{code}` (case-insensitive) | `200` group; `404 "No group with this code"`; joining twice is a no-op |
| GET | `/api/groups` | ✓ | – | my groups, sorted by name |
| GET | `/api/groups/{id}` | ✓ | – | group + `members: [{id, email, is_owner}]`; non-member → `404` |

Invite codes: 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.

## Deadlines (#4)

Deadline object: `{id, group_id, group_name, title, course, description, due_at, author: {id, email}, can_edit}`
(`due_at` is UTC ISO-8601; `can_edit` = author or group owner).

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/groups/{group_id}/deadlines` | member | `{title ≤120, course ≤60, due_at (with timezone), description? ≤2000}` | `201` deadline; non-member → `404` |
| GET | `/api/groups/{group_id}/deadlines` | member | – | `{upcoming: [...soonest first], past: [...most recent first]}` |
| GET | `/api/deadlines` | ✓ | – | same shape, from all my groups |
| PATCH | `/api/deadlines/{id}` | author/owner | any subset of the fields | `200` deadline; member → `403`; non-member → `404` |
| DELETE | `/api/deadlines/{id}` | author/owner | – | `204`; member → `403`; non-member → `404` |
