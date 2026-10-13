import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import MainScreen from "../MainScreen";
import { mockFetch, route } from "../test/fetchMock";

const user = { id: 1, email: "ali@sdu.kz" };
const css = { id: 7, name: "CSS 314", invite_code: "ABC234", is_owner: true, member_count: 3 };

beforeEach(() => {
  window.location.hash = "";
});

test("empty state when the user has no groups", async () => {
  mockFetch(route("GET", "/api/groups", { body: [] }), route("GET", "/api/deadlines", { body: { upcoming: [], past: [] } }));
  render(<MainScreen user={user} onLogout={() => {}} />);
  expect(await screen.findByText("No groups yet")).toBeInTheDocument();
});

test("creating a group adds it to the sidebar and selects it", async () => {
  const fetch = mockFetch(
    route("GET", "/api/groups", { body: [] }),
    route("POST", "/api/groups", { status: 201, body: css }),
    route("GET", /\/api\/(groups\/7\/)?deadlines/, { body: { upcoming: [], past: [] } }),
  );
  render(<MainScreen user={user} onLogout={() => {}} />);
  await screen.findByText("No groups yet");
  const create = screen.getByRole("button", { name: "Create" });
  expect(create).toBeDisabled();
  await userEvent.type(screen.getByLabelText("New group"), "CSS 314");
  await userEvent.click(create);
  const nav = screen.getByRole("navigation", { name: "Groups" });
  expect(await within(nav).findByText("CSS 314")).toBeInTheDocument();
  expect(window.location.hash).toBe("#/g/7");
  expect(screen.getByRole("heading", { name: "CSS 314" })).toBeInTheDocument();
  const post = fetch.mock.calls.find(([, init]) => (init as RequestInit)?.method === "POST")!;
  expect(JSON.parse((post[1] as RequestInit).body as string)).toEqual({ name: "CSS 314" });
});

test("a wrong invite code shows an error", async () => {
  mockFetch(
    route("GET", "/api/groups", { body: [css] }),
    route("POST", "/api/groups/join", { status: 404, body: { detail: "No group with this code" } }),
    route("GET", /\/api\/(groups\/7\/)?deadlines/, { body: { upcoming: [], past: [] } }),
  );
  render(<MainScreen user={user} onLogout={() => {}} />);
  await userEvent.type(await screen.findByLabelText("Join with code"), "zzzzzz");
  await userEvent.click(screen.getByRole("button", { name: "Join" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No group with this code");
});

test("Copy puts the invite code on the clipboard", async () => {
  window.location.hash = "#/g/7";
  mockFetch(route("GET", "/api/groups", { body: [css] }), route("GET", /\/api\/(groups\/7\/)?deadlines/, { body: { upcoming: [], past: [] } }));
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  render(<MainScreen user={user} onLogout={() => {}} />);
  await userEvent.click(await screen.findByRole("button", { name: "Copy" }));
  expect(writeText).toHaveBeenCalledWith("ABC234");
  expect(await screen.findByText("Copied!")).toBeInTheDocument();
});

test("selection follows the URL hash on load", async () => {
  window.location.hash = "#/g/7";
  mockFetch(route("GET", "/api/groups", { body: [css] }), route("GET", /\/api\/(groups\/7\/)?deadlines/, { body: { upcoming: [], past: [] } }));
  render(<MainScreen user={user} onLogout={() => {}} />);
  expect(await screen.findByRole("heading", { name: "CSS 314" })).toBeInTheDocument();
  expect(screen.getByText("ABC234")).toBeInTheDocument();
});
