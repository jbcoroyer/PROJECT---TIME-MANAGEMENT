import { describe, expect, it } from "vitest";
import { detectBrowserLocale, resolveLocale, t } from "./index";

describe("resolveLocale", () => {
  it("retourne fr par défaut", () => {
    expect(resolveLocale(null)).toBe("fr");
    expect(resolveLocale("fr-FR")).toBe("fr");
  });

  it("reconnaît l'anglais", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("en-US")).toBe("en");
  });
});

describe("t", () => {
  it("traduit en français", () => {
    expect(t("fr", "common.back")).toBe("Retour");
  });

  it("traduit en anglais", () => {
    expect(t("en", "common.back")).toBe("Back");
  });

  it("interpole les variables", () => {
    expect(t("fr", "setup.stepOf", { step: 2 })).toBe("Étape 2 sur 4");
  });

  it("retombe sur le français si la clé manque en anglais", () => {
    expect(t("en", "setup.stepOf", { step: 1 })).toBe("Step 1 of 4");
  });
});

describe("detectBrowserLocale", () => {
  it("retourne fr hors navigateur (SSR, tests, CI)", () => {
    expect(detectBrowserLocale()).toBe("fr");
  });

  it("lit navigator.language dans le navigateur", () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    Object.defineProperty(globalThis.navigator, "language", {
      value: "en-US",
      configurable: true,
    });
    try {
      expect(detectBrowserLocale()).toBe("en");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
      });
    }
  });
});
