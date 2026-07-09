export type PrintSpeciesOption = {
  value: string;
  label: string;
};

export const DEFAULT_SOCIAL_THEMATICS = [
  "Événement",
  "Marque",
  "Vie entreprise",
  "Produit",
  "Clients",
  "Presse",
] as const;

export const DEFAULT_PRINT_SPECIES: PrintSpeciesOption[] = [
  { value: "general", label: "Général" },
];

function isPrintSpeciesOption(value: unknown): value is PrintSpeciesOption {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.value === "string" && row.value.trim() !== "" && typeof row.label === "string";
}

export function parseSocialThematics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SOCIAL_THEMATICS];
  const items = raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return items.length > 0 ? items : [...DEFAULT_SOCIAL_THEMATICS];
}

export function parsePrintSpecies(raw: unknown): PrintSpeciesOption[] {
  if (!Array.isArray(raw)) return [...DEFAULT_PRINT_SPECIES];
  const items = raw.filter(isPrintSpeciesOption).map((item) => ({
    value: item.value.trim(),
    label: item.label.trim() || item.value.trim(),
  }));
  const hasGeneral = items.some((item) => item.value === "general");
  if (!hasGeneral) {
    items.unshift({ value: "general", label: "Général" });
  }
  return items.length > 0 ? items : [...DEFAULT_PRINT_SPECIES];
}

export function printSpeciesLabel(
  options: PrintSpeciesOption[],
  value: string,
): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

export function formatSocialThematicsLines(values: string[]): string {
  return values.join("\n");
}

export function parseSocialThematicsLines(text: string): string[] {
  return parseSocialThematics(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

export function formatPrintSpeciesLines(options: PrintSpeciesOption[]): string {
  return options.map((item) => `${item.value}|${item.label}`).join("\n");
}

export function parsePrintSpeciesLines(text: string): PrintSpeciesOption[] {
  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, label] = line.split("|").map((part) => part.trim());
      if (!value) return null;
      const slug = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!slug) return null;
      return { value: slug, label: label || value };
    })
    .filter((item): item is PrintSpeciesOption => item !== null);
  return parsePrintSpecies(rows);
}
