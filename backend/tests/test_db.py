import threading

from app.db import get_conn, init_db


def test_request_connection_can_be_closed_on_another_thread(tmp_path, monkeypatch):
    """Regression for #4: uvicorn may run dependency setup and teardown on different threads."""
    monkeypatch.setenv("DS_DB_PATH", str(tmp_path / "t.db"))
    init_db()
    gen = get_conn()
    errors = []

    def open_conn():
        conn = next(gen)
        conn.execute("SELECT 1")

    def close_conn():
        try:
            next(gen, None)
        except Exception as exc:  # pragma: no cover - the failure we guard against
            errors.append(exc)

    for target in (open_conn, close_conn):
        t = threading.Thread(target=target)
        t.start()
        t.join()
    assert errors == []
