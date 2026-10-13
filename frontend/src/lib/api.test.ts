import { api, ApiError, TOKEN_KEY } from "./api";
import { mockFetch, route } from "../test/fetchMock";

test("adds the bearer token when one is stored", async () => {
  localStorage.setItem(TOKEN_KEY, "abc");
  const fetch = mockFetch(route("GET", "/api/auth/me", { body: { id: 1, email: "a@b.kz" } }));
  await api("/api/auth/me");
  const init = fetch.mock.calls[0][1] as RequestInit;
  expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer abc");
});

test("sends no Authorization header without a token", async () => {
  const fetch = mockFetch(route("GET", "/api/health", { body: { status: "ok" } }));
  await api("/api/health");
  const init = fetch.mock.calls[0][1] as RequestInit;
  expect((init.headers as Record<string, string>)["Authorization"]).toBeUndefined();
});

test("throws ApiError with status and detail", async () => {
  mockFetch(route("POST", "/api/auth/login", { status: 401, body: { detail: "Invalid email or password" } }));
  await expect(api("/api/auth/login", { method: "POST", body: {} })).rejects.toMatchObject({
    status: 401,
    detail: "Invalid email or password",
  });
  await expect(api("/api/auth/login", { method: "POST", body: {} })).rejects.toBeInstanceOf(ApiError);
});
