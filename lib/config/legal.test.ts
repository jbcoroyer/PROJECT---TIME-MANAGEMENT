import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertProductionLegalConfig,
  getMissingRequiredLegalFields,
  getVatDisplay,
  isProductionLegalEnforcement,
  VAT_NOT_APPLICABLE_MENTION,
  type LegalConfig,
} from "./legal";

function baseConfig(overrides: Partial<LegalConfig> = {}): LegalConfig {
  return {
    productName: "RegiePilot",
    tradeName: "RegieLab",
    productTagline: "",
    legalName: "Jean-Baptiste Coroyer",
    siret: "",
    apeCode: "",
    vatNumber: "",
    registeredAddress: "",
    contactEmail: "",
    dpoEmail: "",
    hostingProvider: "Vercel",
    hostingProviderAddress: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    publicationDirector: "Jean-Baptiste Coroyer",
    ...overrides,
  };
}

describe("config légale", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("affiche la mention 293 B CGI lorsque vatNumber est vide", () => {
    expect(getVatDisplay(baseConfig())).toBe(VAT_NOT_APPLICABLE_MENTION);
    expect(getVatDisplay(baseConfig({ vatNumber: "FR123" }))).toBe("FR123");
  });

  it("autorise siret/ape/adresse vides hors production", () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("ENFORCE_LEGAL_CONFIG", "");
    expect(isProductionLegalEnforcement()).toBe(false);
    expect(() => assertProductionLegalConfig(baseConfig())).not.toThrow();
    expect(getMissingRequiredLegalFields(baseConfig())).toEqual([
      "siret",
      "apeCode",
      "registeredAddress",
    ]);
  });

  it("bloque en production si les champs obligatoires sont vides", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isProductionLegalEnforcement()).toBe(true);
    expect(() => assertProductionLegalConfig(baseConfig())).toThrow(/LEGAL_SIRET/);
  });

  it("passe en production lorsque siret, ape et adresse sont renseignés", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() =>
      assertProductionLegalConfig(
        baseConfig({
          siret: "123 456 789 00012",
          apeCode: "58.29C",
          registeredAddress: "10 rue Exemple, 75000 Paris",
        }),
      ),
    ).not.toThrow();
  });
});
