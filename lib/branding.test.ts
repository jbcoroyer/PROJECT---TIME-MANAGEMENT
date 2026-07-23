import { afterEach, describe, expect, it, vi } from "vitest";
import { mergeBranding, mapAppSettingsRow } from "./branding";
import { getProductIdentity } from "./config/legal";

describe("mergeBranding", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("utilise productName par défaut sans ligne en base", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "");
    vi.stubEnv("NEXT_PUBLIC_APP_SHORT_NAME", "");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_NAME", "");
    const branding = mergeBranding(null);
    const { productName } = getProductIdentity();
    expect(productName).toBe("RegiePilot");
    expect(branding.appName).toBe(productName);
    expect(branding.appShortName).toBe(productName);
    expect(branding.isConfigured).toBe(false);
  });

  it("remplace l'ancienne marque Workspace par productName", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_NAME", "RegiePilot");
    const branding = mergeBranding(
      mapAppSettingsRow({
        id: "default",
        app_name: "Workspace",
        app_short_name: "Workspace",
      }),
    );
    expect(branding.appName).toBe("RegiePilot");
    expect(branding.appShortName).toBe("RegiePilot");
  });

  it("priorise la base sur les défauts", () => {
    const branding = mergeBranding(
      mapAppSettingsRow({
        id: "default",
        app_name: "Acme Hub",
        tagline: "Équipe marketing",
        primary_color: "#ff00aa",
        is_configured: true,
      }),
    );
    expect(branding.appName).toBe("Acme Hub");
    expect(branding.tagline).toBe("");
    expect(branding.primaryColor).toBe("#ff00aa");
    expect(branding.isConfigured).toBe(true);
  });

  it("reprend idena_mark_url si mark_url est vide", () => {
    const branding = mergeBranding(
      mapAppSettingsRow({
        id: "default",
        idena_mark_url: "https://example.com/mark.svg",
      }),
    );
    expect(branding.markUrl).toBe("https://example.com/mark.svg");
  });
});
