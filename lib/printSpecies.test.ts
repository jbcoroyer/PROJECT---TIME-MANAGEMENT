import { describe, expect, it } from "vitest";
import { decodePrintItemType, encodePrintItemType } from "./printSpecies";

describe("encodePrintItemType", () => {
  it("retourne une chaîne vide si docType est vide", () => {
    expect(encodePrintItemType("", "volaille")).toBe("");
    expect(encodePrintItemType("   ", "porcs")).toBe("");
  });

  it("retourne le docType brut quand species='general'", () => {
    expect(encodePrintItemType("Fiche commerciale", "general")).toBe("Fiche commerciale");
  });

  it("encode species + docType avec préfixe pour species ≠ 'general'", () => {
    expect(encodePrintItemType("Fiche technique", "volaille")).toBe(
      "__species:volaille__::Fiche technique",
    );
    expect(encodePrintItemType("PLV salon", "segment-a")).toBe(
      "__species:segment-a__::PLV salon",
    );
  });

  it("normalise la valeur species en slug", () => {
    expect(encodePrintItemType("  Fiche  ", "Segment A")).toBe("__species:segmenta__::Fiche");
  });
});

describe("decodePrintItemType", () => {
  it("retourne { docType, species: 'general' } pour un type non encodé", () => {
    expect(decodePrintItemType("Fiche commerciale")).toEqual({
      docType: "Fiche commerciale",
      species: "general",
    });
  });

  it("décode correctement species et docType depuis le format encodé", () => {
    expect(decodePrintItemType("__species:volaille__::Fiche technique")).toEqual({
      docType: "Fiche technique",
      species: "volaille",
    });
    expect(decodePrintItemType("__species:segment-b__::Catalogue")).toEqual({
      docType: "Catalogue",
      species: "segment-b",
    });
  });

  it("est tolérant aux espaces autour", () => {
    expect(decodePrintItemType("  __species:porcs__::Fiche  ")).toEqual({
      docType: "Fiche",
      species: "porcs",
    });
  });

  it("est insensible à la casse pour le tag species", () => {
    expect(decodePrintItemType("__species:VOLAILLE__::Fiche")).toEqual({
      docType: "Fiche",
      species: "volaille",
    });
  });

  it("retombe sur 'general' si le préfixe est malformé", () => {
    expect(decodePrintItemType("__species:__::Fiche")).toEqual({
      docType: "__species:__::Fiche",
      species: "general",
    });
  });

  it("encode puis décode renvoie l'entrée (round-trip)", () => {
    for (const species of ["general", "segment-a", "segment-b"]) {
      const docType = `Document ${species}`;
      const encoded = encodePrintItemType(docType, species);
      expect(decodePrintItemType(encoded)).toEqual({ docType, species });
    }
  });
});
