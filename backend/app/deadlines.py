"""Deadlines: create, list (upcoming/past), edit, delete."""
import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, field_validator

from app import permissions
from app.auth import Conn, CurrentUser
from app.groups import get_member_group

router = APIRouter(prefix="/api", tags=["deadlines"])


def to_utc_iso(value: str) -> str:
    try:
        dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        raise ValueError("due_at must be an ISO-8601 date-time")
    if dt.tzinfo is None:
        raise ValueError("due_at must include a timezone")
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds")


def _text(value: str, field: str, max_len: int, required: bool = True) -> str:
    value = value.strip()
    if required and not value:
        raise ValueError(f"{field} is required")
    if len(value) > max_len:
        raise ValueError(f"{field} must be at most {max_len} characters")
    return value


class DeadlineIn(BaseModel):
    title: str
    course: str
    due_at: str
    description: str = ""

    @field_validator("title")
    @classmethod
    def v_title(cls, v: str) -> str:
        return _text(v, "title", 120)

    @field_validator("course")
    @classmethod
    def v_course(cls, v: str) -> str:
        return _text(v, "course", 60)

    @field_validator("description")
    @classmethod
    def v_description(cls, v: str) -> str:
        return _text(v, "description", 2000, required=False)

    @field_validator("due_at")
    @classmethod
    def v_due(cls, v: str) -> str:
        return to_utc_iso(v)


class DeadlinePatch(BaseModel):
    title: str | None = None
    course: str | None = None
    due_at: str | None = None
    description: str | None = None

    _v_title = field_validator("title")(lambda cls, v: v if v is None else _text(v, "title", 120))
    _v_course = field_validator("course")(lambda cls, v: v if v is None else _text(v, "course", 60))
    _v_desc = field_validator("description")(
        lambda cls, v: v if v is None else _text(v, "description", 2000, required=False)
    )
    _v_due = field_validator("due_at")(lambda cls, v: v if v is None else to_utc_iso(v))


SELECT = """
SELECT d.*, g.name AS group_name, u.email AS author_email
FROM deadlines d
JOIN groups g ON g.id = d.group_id
JOIN users u ON u.id = d.author_id
"""


def deadline_out(conn: sqlite3.Connection, row: sqlite3.Row, user_id: int) -> dict:
    return {
        "id": row["id"],
        "group_id": row["group_id"],
        "group_name": row["group_name"],
        "title": row["title"],
        "course": row["course"],
        "description": row["description"],
        "due_at": row["due_at"],
        "author": {"id": row["author_id"], "email": row["author_email"]},
        "can_edit": permissions.can_edit_deadline(conn, user_id, row),
        "done": conn.execute(
            "SELECT 1 FROM completions WHERE user_id = ? AND deadline_id = ?", (user_id, row["id"])
        ).fetchone()
        is not None,
    }


def split(conn: sqlite3.Connection, rows: list[sqlite3.Row], user_id: int) -> dict:
    now = datetime.now(timezone.utc)
    items = [deadline_out(conn, r, user_id) for r in rows]
    upcoming = [d for d in items if datetime.fromisoformat(d["due_at"]) > now]
    past = [d for d in items if datetime.fromisoformat(d["due_at"]) <= now]
    upcoming.sort(key=lambda d: (d["due_at"], d["id"]))
    past.sort(key=lambda d: (d["due_at"], d["id"]), reverse=True)
    return {"upcoming": upcoming, "past": past}


def get_visible_deadline(conn: sqlite3.Connection, user_id: int, deadline_id: int) -> sqlite3.Row:
    """The deadline if the user is a member of its group, else 404."""
    row = conn.execute(SELECT + " WHERE d.id = ?", (deadline_id,)).fetchone()
    if row is None or not permissions.is_member(conn, user_id, row["group_id"]):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Deadline not found")
    return row


@router.post("/groups/{group_id}/deadlines", status_code=status.HTTP_201_CREATED)
def create_deadline(group_id: int, data: DeadlineIn, conn: Conn, user: CurrentUser) -> dict:
    get_member_group(conn, user["id"], group_id)
    cur = conn.execute(
        "INSERT INTO deadlines (group_id, author_id, title, course, description, due_at) VALUES (?, ?, ?, ?, ?, ?)",
        (group_id, user["id"], data.title, data.course, data.description, data.due_at),
    )
    row = conn.execute(SELECT + " WHERE d.id = ?", (cur.lastrowid,)).fetchone()
    return deadline_out(conn, row, user["id"])


@router.get("/groups/{group_id}/deadlines")
def list_group_deadlines(group_id: int, conn: Conn, user: CurrentUser) -> dict:
    get_member_group(conn, user["id"], group_id)
    rows = conn.execute(SELECT + " WHERE d.group_id = ?", (group_id,)).fetchall()
    return split(conn, rows, user["id"])


@router.get("/deadlines")
def list_my_deadlines(conn: Conn, user: CurrentUser) -> dict:
    rows = conn.execute(
        SELECT + " JOIN memberships m ON m.group_id = d.group_id WHERE m.user_id = ?", (user["id"],)
    ).fetchall()
    return split(conn, rows, user["id"])


def _editable(conn: sqlite3.Connection, user_id: int, deadline_id: int) -> sqlite3.Row:
    row = get_visible_deadline(conn, user_id, deadline_id)
    if not permissions.can_edit_deadline(conn, user_id, row):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the author or the group owner can change this deadline")
    return row


@router.patch("/deadlines/{deadline_id}")
def update_deadline(deadline_id: int, data: DeadlinePatch, conn: Conn, user: CurrentUser) -> dict:
    _editable(conn, user["id"], deadline_id)
    changes = data.model_dump(exclude_none=True)
    if changes:
        sets = ", ".join(f"{k} = ?" for k in changes)
        conn.execute(f"UPDATE deadlines SET {sets} WHERE id = ?", (*changes.values(), deadline_id))
    row = conn.execute(SELECT + " WHERE d.id = ?", (deadline_id,)).fetchone()
    return deadline_out(conn, row, user["id"])


@router.delete("/deadlines/{deadline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deadline(deadline_id: int, conn: Conn, user: CurrentUser) -> Response:
    _editable(conn, user["id"], deadline_id)
    conn.execute("DELETE FROM completions WHERE deadline_id = ?", (deadline_id,))
    conn.execute("DELETE FROM deadlines WHERE id = ?", (deadline_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/deadlines/{deadline_id}/done")
def mark_done(deadline_id: int, conn: Conn, user: CurrentUser) -> dict:
    get_visible_deadline(conn, user["id"], deadline_id)
    conn.execute(
        "INSERT OR IGNORE INTO completions (user_id, deadline_id) VALUES (?, ?)", (user["id"], deadline_id)
    )
    return {"done": True}


@router.delete("/deadlines/{deadline_id}/done")
def mark_not_done(deadline_id: int, conn: Conn, user: CurrentUser) -> dict:
    get_visible_deadline(conn, user["id"], deadline_id)
    conn.execute("DELETE FROM completions WHERE user_id = ? AND deadline_id = ?", (user["id"], deadline_id))
    return {"done": False}
