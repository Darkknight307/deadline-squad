import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Board from "./Board";
import { mockFetch, route } from "../test/fetchMock";
import type { Deadline } from "../lib/api";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const base: Deadline = {
  id: 1,
  group_id: 7,
  group_name: "CSS 314",
  title: "Lab 3",
  course: "CSS 314",
  description: "Chapter 4",
  due_at: new Date(Date.now() + 2 * 86400000).toISOString(),
  author: { id: 2, email: "mate@sdu.kz" },
  can_edit: false,
  done: false,
};

test("a card without can_edit has no Edit/Delete buttons", async () => {
  mockFetch(route("GET", "/api/groups/7/deadlines", { body: { upcoming: [base], past: [] } }));
  render(<Board groupId={7} />);
  const card = await screen.findByRole("listitem", { name: "Lab 3" });
  expect(within(card).queryByRole("button", { name: "Edit" })).toBeNull();
  expect(within(card).queryByRole("button", { name: "Delete" })).toBeNull();
});

test("a card with can_edit shows Edit and asks before deleting", async () => {
  const fetch = mockFetch(
    route("GET", "/api/groups/7/deadlines", { body: { upcoming: [{ ...base, can_edit: true }], past: [] } }),
    route("DELETE", "/api/deadlines/1", { status: 204 }),
  );
  render(<Board groupId={7} />);
  const card = await screen.findByRole("listitem", { name: "Lab 3" });
  expect(within(card).getByRole("button", { name: "Edit" })).toBeInTheDocument();
  await userEvent.click(within(card).getByRole("button", { name: "Delete" }));
  expect(fetch.mock.calls.some(([, i]) => (i as RequestInit)?.method === "DELETE")).toBe(false);
  await userEvent.click(await within(card).findByRole("button", { name: "Yes, delete" }));
  expect(fetch.mock.calls.some(([u, i]) => u === "/api/deadlines/1" && (i as RequestInit)?.method === "DELETE")).toBe(true);
});

test("ticking the checkbox sends PUT /done and fires confetti", async () => {
  const confetti = (await import("canvas-confetti")).default as unknown as ReturnType<typeof vi.fn>;
  const fetch = mockFetch(
    route("GET", "/api/groups/7/deadlines", { body: { upcoming: [base], past: [] } }),
    route("PUT", "/api/deadlines/1/done", { body: { done: true } }),
  );
  render(<Board groupId={7} />);
  await userEvent.click(await screen.findByLabelText("Mark Lab 3 done"));
  expect(fetch.mock.calls.some(([u, i]) => u === "/api/deadlines/1/done" && (i as RequestInit)?.method === "PUT")).toBe(true);
  expect(confetti).toHaveBeenCalled();
  expect(await screen.findByLabelText("Mark Lab 3 not done")).toBeChecked();
});

test("past deadlines are collapsed under a counter", async () => {
  const past = { ...base, id: 2, title: "Quiz 1", due_at: new Date(Date.now() - 3600000).toISOString() };
  mockFetch(route("GET", "/api/groups/7/deadlines", { body: { upcoming: [base], past: [past] } }));
  render(<Board groupId={7} />);
  const toggle = await screen.findByRole("button", { name: /Past \(1\)/ });
  expect(screen.queryByRole("listitem", { name: "Quiz 1" })).toBeNull();
  await userEvent.click(toggle);
  expect(await screen.findByRole("listitem", { name: "Quiz 1" })).toBeInTheDocument();
});

test("add form keeps Save disabled until title, course and date are filled; posts with offset", async () => {
  const created = { ...base, id: 9, title: "Essay", can_edit: true };
  const fetch = mockFetch(
    route("GET", "/api/groups/7/deadlines", { body: { upcoming: [], past: [] } }),
    route("POST", "/api/groups/7/deadlines", { status: 201, body: created }),
  );
  render(<Board groupId={7} />);
  await userEvent.click(await screen.findByRole("button", { name: "+ Add deadline" }));
  const dialog = screen.getByRole("dialog", { name: "Add deadline" });
  const save = within(dialog).getByRole("button", { name: "Save" });
  expect(save).toBeDisabled();
  await userEvent.type(within(dialog).getByLabelText("Title"), "Essay");
  await userEvent.type(within(dialog).getByLabelText("Course"), "HIS 101");
  expect(save).toBeDisabled();
  await userEvent.type(within(dialog).getByLabelText("Due"), "2099-05-01T10:30");
  expect(save).toBeEnabled();
  await userEvent.click(save);
  const post = fetch.mock.calls.find(([, i]) => (i as RequestInit)?.method === "POST")!;
  const body = JSON.parse((post[1] as RequestInit).body as string);
  expect(body.title).toBe("Essay");
  expect(body.due_at).toMatch(/^2099-05-01T10:30:00[+-]\d\d:\d\d$/);
  expect(await screen.findByRole("listitem", { name: "Essay" })).toBeInTheDocument();
});

test("all-groups view has no Add button and shows group names", async () => {
  mockFetch(route("GET", "/api/deadlines", { body: { upcoming: [base], past: [] } }));
  render(<Board groupId={null} />);
  const card = await screen.findByRole("listitem", { name: "Lab 3" });
  expect(within(card).getAllByText("CSS 314").length).toBe(2);
  expect(screen.queryByRole("button", { name: "+ Add deadline" })).toBeNull();
});

test("a deadline that passes while the page is open moves to Past", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const soon = { ...base, due_at: new Date(Date.now() + 1500).toISOString() };
  mockFetch(route("GET", "/api/groups/7/deadlines", { body: { upcoming: [soon], past: [] } }));
  render(<Board groupId={7} />);
  await screen.findByText("Upcoming (1)");
  await vi.advanceTimersByTimeAsync(3000);
  expect(await screen.findByRole("button", { name: /Past \(1\)/ })).toBeInTheDocument();
  expect(screen.getByText("Upcoming (0)")).toBeInTheDocument();
});
