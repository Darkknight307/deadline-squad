import os
import sqlite3

from tests.conftest import auth_header, register


def users(client):
    conn = sqlite3.connect(os.environ["DS_DB_PATH"])
    rows = conn.execute("SELECT email, password_hash FROM users").fetchall()
    conn.close()
    return rows


def test_register_returns_token_and_user(client):
    r = client.post("/api/auth/register", json={"email": "ali@sdu.kz", "password": "password123"})
    assert r.status_code == 201
    body = r.json()
    assert body["token"]
    assert body["user"]["email"] == "ali@sdu.kz"


def test_email_is_trimmed_and_lowercased(client):
    body = register(client, email="  Ali@SDU.kz ")
    assert body["user"]["email"] == "ali@sdu.kz"
    assert users(client)[0][0] == "ali@sdu.kz"


def test_password_is_stored_hashed(client):
    register(client, password="supersecret1")
    (email, stored), = users(client)
    assert "supersecret1" not in stored
    assert stored.startswith("pbkdf2_sha256$")


def test_invalid_email_rejected(client):
    for bad in ["", "ali", "ali@sdu", "a b@sdu.kz"]:
        r = client.post("/api/auth/register", json={"email": bad, "password": "password123"})
        assert r.status_code == 422, bad
    assert users(client) == []


def test_short_password_rejected(client):
    r = client.post("/api/auth/register", json={"email": "ali@sdu.kz", "password": "short"})
    assert r.status_code == 422
    assert users(client) == []


def test_duplicate_email_in_other_case_conflicts(client):
    register(client, email="ali@sdu.kz")
    r = client.post("/api/auth/register", json={"email": "ALI@sdu.kz", "password": "password123"})
    assert r.status_code == 409
    assert r.json()["detail"] == "Email already registered"
    assert len(users(client)) == 1


def test_login_returns_new_token_case_insensitive(client):
    first = register(client)
    r = client.post("/api/auth/login", json={"email": "ALI@SDU.KZ", "password": "password123"})
    assert r.status_code == 200
    assert r.json()["token"] != first["token"]
    assert r.json()["user"]["email"] == "ali@sdu.kz"


def test_wrong_password_and_unknown_email_same_401(client):
    register(client)
    wrong = client.post("/api/auth/login", json={"email": "ali@sdu.kz", "password": "nope-nope"})
    unknown = client.post("/api/auth/login", json={"email": "who@sdu.kz", "password": "password123"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json() == {"detail": "Invalid email or password"}


def test_me_requires_valid_token(client):
    token = register(client)["token"]
    assert client.get("/api/auth/me", headers=auth_header(token)).json()["email"] == "ali@sdu.kz"
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": token}).status_code == 401
    assert client.get("/api/auth/me", headers=auth_header("not-a-token")).status_code == 401


def test_logout_invalidates_only_that_token(client):
    t1 = register(client)["token"]
    t2 = client.post("/api/auth/login", json={"email": "ali@sdu.kz", "password": "password123"}).json()["token"]
    assert client.post("/api/auth/logout", headers=auth_header(t1)).status_code == 204
    assert client.get("/api/auth/me", headers=auth_header(t1)).status_code == 401
    assert client.get("/api/auth/me", headers=auth_header(t2)).status_code == 200
