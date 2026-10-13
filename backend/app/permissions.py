"""All authorization checks live here (see _docs/decisions.md item 4)."""
import sqlite3


def is_member(conn: sqlite3.Connection, user_id: int, group_id: int) -> bool:
    row = conn.execute(
        "SELECT 1 FROM memberships WHERE user_id = ? AND group_id = ?", (user_id, group_id)
    ).fetchone()
    return row is not None


def is_owner(conn: sqlite3.Connection, user_id: int, group_id: int) -> bool:
    row = conn.execute(
        "SELECT 1 FROM groups WHERE id = ? AND owner_id = ?", (group_id, user_id)
    ).fetchone()
    return row is not None


def can_edit_deadline(conn: sqlite3.Connection, user_id: int, deadline: sqlite3.Row) -> bool:
    """Author of the deadline or owner of its group."""
    return deadline["author_id"] == user_id or is_owner(conn, user_id, deadline["group_id"])
