import os
import sqlite3

import pytest

from tests.conftest import add_deadline, auth_header, create_group, join, register


def completions():
    conn = sqlite3.connect(os.environ["DS_DB_PATH"])
    n = conn.execute("SELECT COUNT(*) FROM completions").fetchone()[0]
    conn.close()
    return n


@pytest.fixture
def setup(client):
    a = register(client, "a@sdu.kz")["token"]
    b = register(client, "b@sdu.kz")["token"]
    x = register(client, "x@sdu.kz")["token"]
    g = create_group(client, a)
    join(client, b, g["invite_code"])
    d = add_deadline(client, a, g["id"])
    return {"a": a, "b": b, "x": x, "g": g, "d": d}


def listed(client, token, gid):
    data = client.get(f"/api/groups/{gid}/deadlines", headers=auth_header(token)).json()
    return data["upcoming"] + data["past"]


def test_new_deadline_is_not_done(setup):
    assert setup["d"]["done"] is False


def test_mark_done_is_idempotent(client, setup):
    url = f"/api/deadlines/{setup['d']['id']}/done"
    for _ in range(2):
        r = client.put(url, headers=auth_header(setup["b"]))
        assert r.status_code == 200 and r.json() == {"done": True}
    assert completions() == 1


def test_undo_is_idempotent(client, setup):
    url = f"/api/deadlines/{setup['d']['id']}/done"
    client.put(url, headers=auth_header(setup["b"]))
    for _ in range(2):
        r = client.delete(url, headers=auth_header(setup["b"]))
        assert r.status_code == 200 and r.json() == {"done": False}
    assert completions() == 0


def test_done_is_personal(client, setup):
    client.put(f"/api/deadlines/{setup['d']['id']}/done", headers=auth_header(setup["b"]))
    assert listed(client, setup["b"], setup["g"]["id"])[0]["done"] is True
    assert listed(client, setup["a"], setup["g"]["id"])[0]["done"] is False
    mine = client.get("/api/deadlines", headers=auth_header(setup["b"])).json()["upcoming"]
    assert mine[0]["done"] is True


def test_done_flag_in_patch_response(client, setup):
    client.put(f"/api/deadlines/{setup['d']['id']}/done", headers=auth_header(setup["a"]))
    r = client.patch(f"/api/deadlines/{setup['d']['id']}", json={"title": "New"}, headers=auth_header(setup["a"]))
    assert r.json()["done"] is True


def test_non_member_and_unknown_are_404(client, setup):
    url = f"/api/deadlines/{setup['d']['id']}/done"
    assert client.put(url, headers=auth_header(setup["x"])).status_code == 404
    assert client.delete(url, headers=auth_header(setup["x"])).status_code == 404
    assert client.put("/api/deadlines/999/done", headers=auth_header(setup["a"])).status_code == 404
    assert completions() == 0


def test_deleting_deadline_removes_completions(client, setup):
    client.put(f"/api/deadlines/{setup['d']['id']}/done", headers=auth_header(setup["a"]))
    client.put(f"/api/deadlines/{setup['d']['id']}/done", headers=auth_header(setup["b"]))
    assert completions() == 2
    assert client.delete(f"/api/deadlines/{setup['d']['id']}", headers=auth_header(setup["a"])).status_code == 204
    assert completions() == 0


def test_done_deadline_stays_in_its_list(client, setup):
    client.put(f"/api/deadlines/{setup['d']['id']}/done", headers=auth_header(setup["a"]))
    data = client.get(f"/api/groups/{setup['g']['id']}/deadlines", headers=auth_header(setup["a"])).json()
    assert [d["id"] for d in data["upcoming"]] == [setup["d"]["id"]]
