import os
import sqlite3
from datetime import datetime, timedelta, timezone

import pytest

from tests.conftest import add_deadline, auth_header, create_group, join, register


def count_deadlines():
    conn = sqlite3.connect(os.environ["DS_DB_PATH"])
    n = conn.execute("SELECT COUNT(*) FROM deadlines").fetchone()[0]
    conn.close()
    return n


@pytest.fixture
def squad(client):
    """owner + member in one group, plus a stranger in no group."""
    owner = register(client, "owner@sdu.kz")["token"]
    member = register(client, "mate@sdu.kz")["token"]
    stranger = register(client, "x@sdu.kz")["token"]
    group = create_group(client, owner, "CSS 314")
    join(client, member, group["invite_code"])
    return {"owner": owner, "member": member, "stranger": stranger, "group": group}


def iso(delta):
    return (datetime.now(timezone.utc) + delta).isoformat()


def test_member_creates_deadline_with_full_shape(client, squad):
    d = add_deadline(client, squad["member"], squad["group"]["id"], title="  Quiz 3 ", course=" CSS 314 ", description="Ch. 4")
    assert d["title"] == "Quiz 3" and d["course"] == "CSS 314" and d["description"] == "Ch. 4"
    assert d["group_name"] == "CSS 314"
    assert d["author"]["email"] == "mate@sdu.kz"
    assert d["can_edit"] is True


def test_due_at_is_converted_to_utc(client, squad):
    d = add_deadline(client, squad["owner"], squad["group"]["id"], due_at="2026-10-20T14:00:00+05:00")
    assert d["due_at"] == "2026-10-20T09:00:00+00:00"
    z = add_deadline(client, squad["owner"], squad["group"]["id"], due_at="2026-10-20T09:00:00Z")
    assert z["due_at"] == "2026-10-20T09:00:00+00:00"


@pytest.mark.parametrize("field,value", [
    ("due_at", "2026-10-20T14:00:00"),  # naive
    ("due_at", "tomorrow"),
    ("title", "   "),
    ("course", ""),
    ("title", "x" * 121),
    ("course", "x" * 61),
    ("description", "x" * 2001),
])
def test_invalid_fields_rejected(client, squad, field, value):
    body = {"title": "Lab", "course": "CSS", "due_at": "2099-01-01T00:00:00Z", field: value}
    r = client.post(f"/api/groups/{squad['group']['id']}/deadlines", json=body, headers=auth_header(squad["owner"]))
    assert r.status_code == 422
    assert count_deadlines() == 0


def test_non_member_cannot_create_or_list(client, squad):
    gid = squad["group"]["id"]
    body = {"title": "Lab", "course": "CSS", "due_at": "2099-01-01T00:00:00Z"}
    assert client.post(f"/api/groups/{gid}/deadlines", json=body, headers=auth_header(squad["stranger"])).status_code == 404
    assert client.get(f"/api/groups/{gid}/deadlines", headers=auth_header(squad["stranger"])).status_code == 404
    assert client.post("/api/groups/999/deadlines", json=body, headers=auth_header(squad["owner"])).status_code == 404
    assert count_deadlines() == 0


def test_list_splits_upcoming_and_past_in_order(client, squad):
    gid, t = squad["group"]["id"], squad["owner"]
    later = add_deadline(client, t, gid, title="later", due_at=iso(timedelta(days=5)))
    soon = add_deadline(client, t, gid, title="soon", due_at=iso(timedelta(hours=2)))
    old = add_deadline(client, t, gid, title="old", due_at=iso(-timedelta(days=3)))
    recent = add_deadline(client, t, gid, title="recent", due_at=iso(-timedelta(hours=1)))
    data = client.get(f"/api/groups/{gid}/deadlines", headers=auth_header(squad["member"])).json()
    assert [d["title"] for d in data["upcoming"]] == ["soon", "later"]
    assert [d["title"] for d in data["past"]] == ["recent", "old"]


def test_all_my_deadlines_only_from_my_groups(client, squad):
    other = create_group(client, squad["stranger"], "Other")
    add_deadline(client, squad["stranger"], other["id"], title="secret")
    mine = create_group(client, squad["member"], "Second")
    add_deadline(client, squad["owner"], squad["group"]["id"], title="shared")
    add_deadline(client, squad["member"], mine["id"], title="own")
    titles = {d["title"] for d in client.get("/api/deadlines", headers=auth_header(squad["member"])).json()["upcoming"]}
    assert titles == {"shared", "own"}


def test_author_can_edit_and_delete(client, squad):
    d = add_deadline(client, squad["member"], squad["group"]["id"])
    r = client.patch(f"/api/deadlines/{d['id']}", json={"title": "Lab 3 (updated)", "due_at": "2099-02-01T10:00:00+05:00"}, headers=auth_header(squad["member"]))
    assert r.status_code == 200
    assert r.json()["title"] == "Lab 3 (updated)"
    assert r.json()["due_at"] == "2099-02-01T05:00:00+00:00"
    assert r.json()["course"] == "CSS 314"  # untouched
    assert client.delete(f"/api/deadlines/{d['id']}", headers=auth_header(squad["member"])).status_code == 204
    assert count_deadlines() == 0


def test_owner_can_edit_other_members_deadline(client, squad):
    d = add_deadline(client, squad["member"], squad["group"]["id"])
    listed = client.get(f"/api/groups/{squad['group']['id']}/deadlines", headers=auth_header(squad["owner"])).json()
    assert listed["upcoming"][0]["can_edit"] is True
    r = client.patch(f"/api/deadlines/{d['id']}", json={"course": "CSS 315"}, headers=auth_header(squad["owner"]))
    assert r.status_code == 200 and r.json()["course"] == "CSS 315"
    assert client.delete(f"/api/deadlines/{d['id']}", headers=auth_header(squad["owner"])).status_code == 204


def test_plain_member_gets_403_and_nothing_changes(client, squad):
    d = add_deadline(client, squad["owner"], squad["group"]["id"], title="Owner's")
    listed = client.get(f"/api/groups/{squad['group']['id']}/deadlines", headers=auth_header(squad["member"])).json()
    assert listed["upcoming"][0]["can_edit"] is False
    assert client.patch(f"/api/deadlines/{d['id']}", json={"title": "hacked"}, headers=auth_header(squad["member"])).status_code == 403
    assert client.delete(f"/api/deadlines/{d['id']}", headers=auth_header(squad["member"])).status_code == 403
    after = client.get(f"/api/groups/{squad['group']['id']}/deadlines", headers=auth_header(squad["owner"])).json()["upcoming"]
    assert [x["title"] for x in after] == ["Owner's"]


def test_non_member_edit_is_404(client, squad):
    d = add_deadline(client, squad["owner"], squad["group"]["id"])
    assert client.patch(f"/api/deadlines/{d['id']}", json={"title": "x"}, headers=auth_header(squad["stranger"])).status_code == 404
    assert client.delete(f"/api/deadlines/{d['id']}", headers=auth_header(squad["stranger"])).status_code == 404
    assert count_deadlines() == 1


def test_patch_validates_like_create(client, squad):
    d = add_deadline(client, squad["owner"], squad["group"]["id"])
    for body in [{"title": "  "}, {"due_at": "2099-01-01T00:00:00"}, {"course": "x" * 61}]:
        r = client.patch(f"/api/deadlines/{d['id']}", json=body, headers=auth_header(squad["owner"]))
        assert r.status_code == 422, body
