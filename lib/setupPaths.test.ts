import { describe, expect, it } from "vitest";
import { isSetupExemptPath, SETUP_PATH } from "./setupPaths";

describe("isSetupExemptPath", () => {
  it("autorise l'accueil et la connexion", () => {
    expect(isSetupExemptPath("/")).toBe(true);
    expect(isSetupExemptPath("/login")).toBe(true);
    expect(isSetupExemptPath("/login/reset-password")).toBe(true);
  });

  it("autorise l'assistant et les formulaires publics", () => {
    expect(isSetupExemptPath(SETUP_PATH)).toBe(true);
    expect(isSetupExemptPath("/questionnaire/f/abc")).toBe(true);
    expect(isSetupExemptPath("/auth/callback")).toBe(true);
  });

  it("redirige les pages applicatives", () => {
    expect(isSetupExemptPath("/dashboard/kanban")).toBe(false);
    expect(isSetupExemptPath("/settings")).toBe(false);
    expect(isSetupExemptPath("/v2/dashboard/kanban")).toBe(false);
  });
});
