import { describe, expect, it } from "vitest";
import { mergeBranding, mapAppSettingsRow } from "./branding";

describe("mergeBranding", () => {
  it("utilise Workspace par défaut sans ligne en base", () => {
    const branding = mergeBranding(null);
    expect(branding.appName).toBe("Workspace");
    expect(branding.appShortName).toBe("Workspace");
    expect(branding.isConfigured).toBe(false);
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
    expect(branding.tagline).toBe("Équipe marketing");
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
