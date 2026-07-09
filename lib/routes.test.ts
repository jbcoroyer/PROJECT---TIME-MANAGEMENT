import { describe, expect, it } from "vitest";
import { DASHBOARD_KANBAN, kanbanHref } from "./routes";

describe("routes", () => {
  it("pointe vers le kanban principal", () => {
    expect(DASHBOARD_KANBAN).toBe("/dashboard/kanban");
    expect(kanbanHref()).toBe("/dashboard/kanban");
    expect(kanbanHref("abc")).toBe("/dashboard/kanban?task=abc");
  });
});
