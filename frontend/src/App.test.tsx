import { render, screen } from "@testing-library/react";
import App from "./App";

test("logged-out app shows the Deadline Squad heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Deadline Squad" })).toBeInTheDocument();
});
