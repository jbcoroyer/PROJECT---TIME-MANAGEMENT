import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  markModuleVisited,
  readVisitedModules,
  shouldShowModuleDiscoveryBadge,
} from "./moduleVisitStorage";

const USER = "user-test-1";

describe("moduleVisitStorage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
    vi.stubGlobal("window", { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty set when nothing stored", () => {
    expect(readVisitedModules(USER).size).toBe(0);
  });

  it("persists visited modules per user", () => {
    markModuleVisited(USER, "planning");
    expect(readVisitedModules(USER).has("planning")).toBe(true);
    expect(readVisitedModules("other-user").has("planning")).toBe(false);
  });

  it("does not badge dashboard or visited modules", () => {
    const visited = new Set(["asks"] as const);
    expect(shouldShowModuleDiscoveryBadge("dashboard", visited)).toBe(false);
    expect(shouldShowModuleDiscoveryBadge("asks", visited)).toBe(false);
    expect(shouldShowModuleDiscoveryBadge("planning", visited)).toBe(true);
    expect(shouldShowModuleDiscoveryBadge(null, visited)).toBe(false);
  });
});
