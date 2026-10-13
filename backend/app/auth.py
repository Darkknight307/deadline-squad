"""Accounts: register, login, logout, current user."""
import hashlib
import hmac
import re
import secrets
import sqlite3
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from pydantic import BaseModel, field_validator

from app.db import get_conn

router = APIRouter(prefix="/api/auth", tags=["auth"])

ITERATIONS = 200_000
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, digest = stored.split("$")
    except ValueError:
        return False
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(iterations))
    return hmac.compare_digest(check.hex(), digest)


class Credentials(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email")
        return v


class RegisterIn(Credentials):
    @field_validator("password")
    @classmethod
    def long_enough(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


def _user_out(row: sqlite3.Row) -> dict:
    return {"id": row["id"], "email": row["email"]}


def _new_session(conn: sqlite3.Connection, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
    return token


Conn = Annotated[sqlite3.Connection, Depends(get_conn)]


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return authorization.removeprefix("Bearer ").strip()


def current_user(conn: Conn, authorization: Annotated[str | None, Header()] = None) -> sqlite3.Row:
    """Dependency for protected endpoints: the user owning the bearer token."""
    token = _bearer(authorization)
    row = conn.execute(
        "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?",
        (token,),
    ).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return row


CurrentUser = Annotated[sqlite3.Row, Depends(current_user)]


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, conn: Conn) -> dict:
    exists = conn.execute("SELECT 1 FROM users WHERE email = ?", (data.email,)).fetchone()
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    cur = conn.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (data.email, hash_password(data.password)),
    )
    user = conn.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return {"token": _new_session(conn, user["id"]), "user": _user_out(user)}


@router.post("/login")
def login(data: Credentials, conn: Conn) -> dict:
    user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email,)).fetchone()
    if user is None or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return {"token": _new_session(conn, user["id"]), "user": _user_out(user)}


@router.get("/me")
def me(user: CurrentUser) -> dict:
    return _user_out(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(conn: Conn, user: CurrentUser, authorization: Annotated[str | None, Header()] = None) -> Response:
    conn.execute("DELETE FROM sessions WHERE token = ?", (_bearer(authorization),))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
