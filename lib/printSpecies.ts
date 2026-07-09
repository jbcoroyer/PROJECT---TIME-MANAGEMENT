export type PrintSpeciesValue = string;

const SPECIES_PREFIX = "__species:";

export function encodePrintItemType(docType: string, species: PrintSpeciesValue): string {
  const cleanDocType = docType.trim();
  if (!cleanDocType) return "";
  const cleanSpecies = species.trim().toLowerCase();
  if (!cleanSpecies || cleanSpecies === "general") return cleanDocType;
  const slug = cleanSpecies.replace(/[^a-z0-9_-]/g, "");
  if (!slug) return cleanDocType;
  return `${SPECIES_PREFIX}${slug}__::${cleanDocType}`;
}

export function decodePrintItemType(rawItemType: string): {
  docType: string;
  species: PrintSpeciesValue;
} {
  const raw = rawItemType.trim();
  const match = raw.match(/^__species:([a-z0-9_-]+)__::(.+)$/i);
  if (!match) {
    return {
      docType: raw,
      species: "general",
    };
  }
  return {
    species: match[1].toLowerCase(),
    docType: match[2].trim(),
  };
}

/** @deprecated Utilisez `useBranding().branding.printSpecies` */
export const PRINT_SPECIES_OPTIONS = [{ value: "general", label: "Général" }] as const;
