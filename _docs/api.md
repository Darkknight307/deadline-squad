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
