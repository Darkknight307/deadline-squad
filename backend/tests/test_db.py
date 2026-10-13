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
