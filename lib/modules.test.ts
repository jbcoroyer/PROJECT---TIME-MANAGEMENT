import { describe, expect, it } from "vitest";
import {
  ALL_MODULE_IDS,
  getCommerciallyAvailableModules,
  getDefaultModuleRoute,
  isPathAllowedForModules,
  parseEnabledModules,
  resolveEnabledModules,
  resolveModuleForPath,
} from "./modules";

describe("modules", () => {
  it("null en base = tous les modules (rétro-compat)", () => {
    expect(resolveEnabledModules(parseEnabledModules(null))).toEqual(ALL_MODULE_IDS);
  });

  it("parse une liste valide", () => {
    expect(parseEnabledModules(["events", "stock", "invalid"])).toEqual(["events", "stock"]);
  });

  it("résout le module événementiel", () => {
    expect(resolveModuleForPath("/events/dashboard")).toBe("events");
    expect(resolveModuleForPath("/events/abc-123")).toBe("events");
  });

  it("résout les modules hors catalogue commercial (routes directes)", () => {
    expect(resolveModuleForPath("/social")).toBe("social");
    expect(resolveModuleForPath("/dam")).toBe("dam");
  });

  it("triage rattaché au module demandes", () => {
    expect(resolveModuleForPath("/asks/triage")).toBe("asks");
    expect(resolveModuleForPath("/dashboard/triage")).toBe("asks");
  });

  it("bloque les routes des modules désactivés", () => {
    expect(isPathAllowedForModules("/events/dashboard", ["dashboard"])).toBe(false);
    expect(isPathAllowedForModules("/settings", ["dashboard"])).toBe(true);
  });

  it("autorise les routes directes social/dam si module activé en base", () => {
    expect(isPathAllowedForModules("/social", ["social", "dashboard"])).toBe(true);
    expect(isPathAllowedForModules("/dam", ["dashboard"])).toBe(false);
  });

  it("redirige vers le premier module actif", () => {
    expect(getDefaultModuleRoute(["events", "stock"])).toBe("/events/dashboard");
    expect(getDefaultModuleRoute(["workspace"])).toBe("/agenda");
  });

  it("exclut social et dam du catalogue commercial", () => {
    const commercial = getCommerciallyAvailableModules();
    expect(commercial).not.toContain("social");
    expect(commercial).not.toContain("dam");
    expect(commercial.length).toBe(ALL_MODULE_IDS.length - 2);
  });
});
