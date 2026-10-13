import os
import sqlite3

from app.groups import CODE_ALPHABET
from tests.conftest import auth_header, create_group, register


def membership_rows():
    conn = sqlite3.connect(os.environ["DS_DB_PATH"])
    n = conn.execute("SELECT COUNT(*) FROM memberships").fetchone()[0]
    conn.close()
    return n


def test_create_group_makes_creator_owner_and_member(client):
    t = register(client)["token"]
    g = create_group(client, t, name="  CSS 314  ")
    assert g["name"] == "CSS 314"
    assert g["is_owner"] is True
    assert g["member_count"] == 1
    assert len(g["invite_code"]) == 6
    assert all(ch in CODE_ALPHABET for ch in g["invite_code"])


def test_group_name_validation(client):
    t = register(client)["token"]
    for bad in ["", "   ", "x" * 61]:
        r = client.post("/api/groups", json={"name": bad}, headers=auth_header(t))
        assert r.status_code == 422
    assert client.get("/api/groups", headers=auth_header(t)).json() == []


def test_same_name_allowed_codes_unique(client):
    t = register(client)["token"]
    a = create_group(client, t, "Same")
    b = create_group(client, t, "Same")
    assert a["invite_code"] != b["invite_code"]


def test_join_with_lowercase_code_and_spaces(client):
    owner = register(client, "owner@sdu.kz")["token"]
    mate = register(client, "mate@sdu.kz")["token"]
    g = create_group(client, owner)
    r = client.post("/api/groups/join", json={"code": f"  {g['invite_code'].lower()} "}, headers=auth_header(mate))
    assert r.status_code == 200
    assert r.json()["id"] == g["id"]
    assert r.json()["is_owner"] is False
    assert r.json()["member_count"] == 2


def test_double_join_is_idempotent(client):
    owner = register(client, "owner@sdu.kz")["token"]
    mate = register(client, "mate@sdu.kz")["token"]
    g = create_group(client, owner)
    for _ in range(2):
        assert client.post("/api/groups/join", json={"code": g["invite_code"]}, headers=auth_header(mate)).status_code == 200
    assert membership_rows() == 2


def test_unknown_code_is_404(client):
    t = register(client)["token"]
    r = client.post("/api/groups/join", json={"code": "ZZZZZZ"}, headers=auth_header(t))
    assert r.status_code == 404
    assert r.json()["detail"] == "No group with this code"
    assert membership_rows() == 0


def test_list_shows_only_my_groups_sorted(client):
    a = register(client, "a@sdu.kz")["token"]
    b = register(client, "b@sdu.kz")["token"]
    create_group(client, a, "zeta")
    create_group(client, a, "Alpha")
    create_group(client, b, "Other")
    names = [g["name"] for g in client.get("/api/groups", headers=auth_header(a)).json()]
    assert names == ["Alpha", "zeta"]


def test_detail_lists_members_for_members_only(client):
    owner = register(client, "owner@sdu.kz")["token"]
    mate = register(client, "mate@sdu.kz")["token"]
    stranger = register(client, "x@sdu.kz")["token"]
    g = create_group(client, owner)
    client.post("/api/groups/join", json={"code": g["invite_code"]}, headers=auth_header(mate))
    d = client.get(f"/api/groups/{g['id']}", headers=auth_header(mate)).json()
    assert [(m["email"], m["is_owner"]) for m in d["members"]] == [("owner@sdu.kz", True), ("mate@sdu.kz", False)]
    assert client.get(f"/api/groups/{g['id']}", headers=auth_header(stranger)).status_code == 404
    assert client.get("/api/groups/999", headers=auth_header(owner)).status_code == 404


def test_group_endpoints_require_login(client):
    assert client.get("/api/groups").status_code == 401
    assert client.post("/api/groups", json={"name": "x"}).status_code == 401
    assert client.post("/api/groups/join", json={"code": "ABCDEF"}).status_code == 401
