import { describe, expect, it } from "vitest";
import { recommendModulesFromQuiz } from "./moduleQuestionnaire";

describe("recommendModulesFromQuiz", () => {
  it("inclut toujours le dashboard", () => {
    const modules = recommendModulesFromQuiz({});
    expect(modules).toContain("dashboard");
  });

  it("recommande les modules événementiel", () => {
    const modules = recommendModulesFromQuiz({
      primaryNeed: "events",
      clientFlow: "minimal",
      operations: "events",
      teamExtras: "none",
    });
    expect(modules).toContain("events");
    expect(modules).toContain("stock");
  });

  it("recommande demandes + agenda pour le flux client", () => {
    const modules = recommendModulesFromQuiz({
      primaryNeed: "clients",
      clientFlow: "forms",
      operations: "none",
      teamExtras: "none",
    });
    expect(modules).toContain("asks");
  });
});
