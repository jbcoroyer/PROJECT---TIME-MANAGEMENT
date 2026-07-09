import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRINT_SPECIES,
  DEFAULT_SOCIAL_THEMATICS,
  parsePrintSpecies,
  parseSocialThematics,
} from "./taxonomies";

describe("parseSocialThematics", () => {
  it("retourne les défauts neutres si la liste est vide", () => {
    expect(parseSocialThematics([])).toEqual([...DEFAULT_SOCIAL_THEMATICS]);
  });

  it("conserve les libellés fournis", () => {
    expect(parseSocialThematics(["Campagne", "Produit"])).toEqual(["Campagne", "Produit"]);
  });
});

describe("parsePrintSpecies", () => {
  it("garantit toujours une entrée general", () => {
    expect(parsePrintSpecies([])).toEqual([...DEFAULT_PRINT_SPECIES]);
  });

  it("parse value|label", () => {
    expect(
      parsePrintSpecies([
        { value: "catalogue", label: "Catalogues" },
        { value: "general", label: "Général" },
      ]),
    ).toEqual([
      { value: "catalogue", label: "Catalogues" },
      { value: "general", label: "Général" },
    ]);
  });
});
