/** Organisation créée pour les données mono-tenant existantes. */
export const LEGACY_ORG_ID = "00000000-0000-0000-0000-000000000001";

export function slugifyOrganizationName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "organisation";
}
