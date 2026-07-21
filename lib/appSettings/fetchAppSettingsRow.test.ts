import { describe, expect, it } from "vitest";
import { isSchemaColumnError } from "./fetchAppSettingsRow";
import { resolveConfiguredStatus } from "../setup/resolveConfiguredStatus";

describe("isSchemaColumnError", () => {
  it("détecte le code Postgres 42703", () => {
    expect(isSchemaColumnError({ code: "42703", message: "..." })).toBe(true);
  });

  it("détecte le message colonne inexistante", () => {
    expect(
      isSchemaColumnError({
        message: 'column "agenda_intro_completed" does not exist',
      }),
    ).toBe(true);
  });

  it("ignore les autres erreurs", () => {
    expect(isSchemaColumnError({ code: "42501", message: "permission denied" })).toBe(false);
  });
});

describe("resolveConfiguredStatus", () => {
  it("considère configuré si l'accès admin le dit", () => {
    expect(
      resolveConfiguredStatus({ accessConfigured: true, brandingConfigured: false }),
    ).toBe(true);
  });

  it("considère configuré si le branding le dit", () => {
    expect(
      resolveConfiguredStatus({ accessConfigured: false, brandingConfigured: true }),
    ).toBe(true);
  });

  it("non configuré seulement si les deux sources disent false", () => {
    expect(
      resolveConfiguredStatus({ accessConfigured: false, brandingConfigured: false }),
    ).toBe(false);
  });
});
