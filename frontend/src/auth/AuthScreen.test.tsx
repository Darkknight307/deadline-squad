import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { TOKEN_KEY } from "../lib/api";
import { mockFetch, route } from "../test/fetchMock";

async function fill(email: string, password: string) {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Password"), password);
}

test("failed login shows the error message", async () => {
  mockFetch(route("POST", "/api/auth/login", { status: 401, body: { detail: "Invalid email or password" } }));
  render(<App />);
  await fill("ali@sdu.kz", "wrongpass");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
});

test("duplicate email on sign up shows a message", async () => {
  mockFetch(route("POST", "/api/auth/register", { status: 409, body: { detail: "Email already registered" } }));
  render(<App />);
  await userEvent.click(screen.getByRole("tab", { name: "Sign up" }));
  await fill("ali@sdu.kz", "password123");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Email already registered");
});

test("successful sign up stores the token and shows the main screen", async () => {
  mockFetch(
    route("POST", "/api/auth/register", { status: 201, body: { token: "tok-1", user: { id: 1, email: "ali@sdu.kz" } } }),
    route("GET", "/api/groups", { body: [] }),
    route("GET", "/api/deadlines", { body: { upcoming: [], past: [] } }),
  );
  render(<App />);
  await userEvent.click(screen.getByRole("tab", { name: "Sign up" }));
  await fill("ali@sdu.kz", "password123");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText("ali@sdu.kz")).toBeInTheDocument();
  expect(localStorage.getItem(TOKEN_KEY)).toBe("tok-1");
});

test("reload with a stale token falls back to the auth card", async () => {
  localStorage.setItem(TOKEN_KEY, "old");
  mockFetch(route("GET", "/api/auth/me", { status: 401, body: { detail: "Not authenticated" } }));
  render(<App />);
  expect(await screen.findByRole("heading", { name: "Deadline Squad" })).toBeInTheDocument();
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
});

test("reload with a valid token shows the main screen; logout clears it", async () => {
  localStorage.setItem(TOKEN_KEY, "good");
  mockFetch(
    route("GET", "/api/auth/me", { body: { id: 1, email: "ali@sdu.kz" } }),
    route("POST", "/api/auth/logout", { status: 204 }),
    route("GET", "/api/groups", { body: [] }),
    route("GET", "/api/deadlines", { body: { upcoming: [], past: [] } }),
  );
  render(<App />);
  expect(await screen.findByText("ali@sdu.kz")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Log out" }));
  expect(await screen.findByRole("tab", { name: "Log in" })).toBeInTheDocument();
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
});
