# Testing guidelines

## Backend (pytest)
- Use the `client` fixture from `tests/conftest.py`: it points the app at a fresh temporary SQLite file per test.
- Use helper fixtures/functions (`register(client, email)`) instead of repeating sign-up code.
- Test through HTTP (`TestClient`), not by calling functions directly.
- Every refusal test asserts the status code **and** that nothing changed (re-fetch and compare).
- Name tests after behaviour: `test_non_member_cannot_list_deadlines`.

## Frontend (Vitest + Testing Library)
- Put pure logic (countdown, urgency, sorting) in `src/lib/` and unit-test it with fixed dates.
- Component tests mock `fetch`; query by role/label/text, not by class names.
- Never rely on the real clock: pass `now` explicitly or use `vi.useFakeTimers()`.
