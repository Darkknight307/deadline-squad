import threading

from app.db import get_conn, init_db


def test_request_connection_can_be_closed_on_another_thread(tmp_path, monkeypatch):
    """Regression for #4: uvicorn may run dependency setup and teardown on different threads."""
    monkeypatch.setenv("DS_DB_PATH", str(tmp_path / "t.db"))
    init_db()
    gen = get_conn()

    def open_conn():
        next(gen).execute("SELECT 1")

    worker = threading.Thread(target=open_conn)
    worker.start()
    worker.join()
    # Teardown (commit + close) on the main thread, a different thread from the opener.
    assert next(gen, "closed") == "closed"


def test_request_connection_commits_before_response_is_sent():
    """Regression for #5: the default 'request' scope commits after the response is sent."""
    from typing import get_args

    from app.auth import Conn

    depends = get_args(Conn)[1]
    assert depends.dependency is get_conn
    assert depends.scope == "function"
