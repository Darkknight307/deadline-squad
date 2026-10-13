"""Groups: create, join by invite code, list, detail."""
import secrets
import sqlite3

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, field_validator

from app import permissions
from app.auth import Conn, CurrentUser

router = APIRouter(prefix="/api/groups", tags=["groups"])

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I
CODE_LENGTH = 6


def new_invite_code(conn: sqlite3.Connection) -> str:
    while True:
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        if not conn.execute("SELECT 1 FROM groups WHERE invite_code = ?", (code,)).fetchone():
            return code


class GroupIn(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required")
        if len(v) > 60:
            raise ValueError("Name must be at most 60 characters")
        return v


class JoinIn(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def clean_code(cls, v: str) -> str:
        return v.strip().upper()


def group_out(conn: sqlite3.Connection, group: sqlite3.Row, user_id: int) -> dict:
    count = conn.execute(
        "SELECT COUNT(*) FROM memberships WHERE group_id = ?", (group["id"],)
    ).fetchone()[0]
    return {
        "id": group["id"],
        "name": group["name"],
        "invite_code": group["invite_code"],
        "is_owner": group["owner_id"] == user_id,
        "member_count": count,
    }


def get_member_group(conn: sqlite3.Connection, user_id: int, group_id: int) -> sqlite3.Row:
    """The group if the user is a member, else 404 (existence is not revealed)."""
    group = conn.execute("SELECT * FROM groups WHERE id = ?", (group_id,)).fetchone()
    if group is None or not permissions.is_member(conn, user_id, group_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
    return group


@router.post("", status_code=status.HTTP_201_CREATED)
def create_group(data: GroupIn, conn: Conn, user: CurrentUser) -> dict:
    cur = conn.execute(
        "INSERT INTO groups (name, invite_code, owner_id) VALUES (?, ?, ?)",
        (data.name, new_invite_code(conn), user["id"]),
    )
    conn.execute("INSERT INTO memberships (group_id, user_id) VALUES (?, ?)", (cur.lastrowid, user["id"]))
    group = conn.execute("SELECT * FROM groups WHERE id = ?", (cur.lastrowid,)).fetchone()
    return group_out(conn, group, user["id"])


@router.post("/join")
def join_group(data: JoinIn, conn: Conn, user: CurrentUser) -> dict:
    group = conn.execute("SELECT * FROM groups WHERE invite_code = ?", (data.code,)).fetchone()
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No group with this code")
    conn.execute(
        "INSERT OR IGNORE INTO memberships (group_id, user_id) VALUES (?, ?)", (group["id"], user["id"])
    )
    return group_out(conn, group, user["id"])


@router.get("")
def list_groups(conn: Conn, user: CurrentUser) -> list[dict]:
    rows = conn.execute(
        """SELECT groups.* FROM groups
           JOIN memberships ON memberships.group_id = groups.id
           WHERE memberships.user_id = ?
           ORDER BY groups.name COLLATE NOCASE, groups.id""",
        (user["id"],),
    ).fetchall()
    return [group_out(conn, g, user["id"]) for g in rows]


@router.get("/{group_id}")
def group_detail(group_id: int, conn: Conn, user: CurrentUser) -> dict:
    group = get_member_group(conn, user["id"], group_id)
    members = conn.execute(
        """SELECT users.id, users.email FROM memberships
           JOIN users ON users.id = memberships.user_id
           WHERE memberships.group_id = ? ORDER BY memberships.joined_at, users.id""",
        (group_id,),
    ).fetchall()
    out = group_out(conn, group, user["id"])
    out["members"] = [
        {"id": m["id"], "email": m["email"], "is_owner": m["id"] == group["owner_id"]} for m in members
    ]
    return out
