import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    """App pointed at a fresh temporary SQLite database."""
    monkeypatch.setenv("DS_DB_PATH", str(tmp_path / "test.db"))
    with TestClient(app) as c:
        yield c


def register(client, email="ali@sdu.kz", password="password123"):
    r = client.post("/api/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    return r.json()


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def create_group(client, token, name="CSS 314"):
    r = client.post("/api/groups", json={"name": name}, headers=auth_header(token))
    assert r.status_code == 201, r.text
    return r.json()


def join(client, token, code):
    r = client.post("/api/groups/join", json={"code": code}, headers=auth_header(token))
    assert r.status_code == 200, r.text
    return r.json()


def add_deadline(client, token, group_id, **fields):
    body = {"title": "Lab 3", "course": "CSS 314", "due_at": "2099-01-01T12:00:00+05:00", "description": ""}
    body.update(fields)
    r = client.post(f"/api/groups/{group_id}/deadlines", json=body, headers=auth_header(token))
    assert r.status_code == 201, r.text
    return r.json()
