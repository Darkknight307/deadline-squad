# HTTP API

All endpoints are under `/api`. Authenticated endpoints need `Authorization: Bearer <token>`.
Errors are JSON `{"detail": "..."}`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | `{"status": "ok"}` |

(Endpoints are added here by the issue that introduces them.)
