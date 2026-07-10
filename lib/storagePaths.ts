/** Durée de validité des URLs signées pour fichiers sensibles (5 minutes). */
export const SIGNED_URL_TTL_SECONDS = 300;

const UUID_SEGMENT_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tous les buckets Supabase utilisés par l'application. */
export const STORAGE_BUCKETS = [
  "idena-mark",
  "member-avatars",
  "company-logos",
  "event-documents",
  "social-post-visuals",
  "stock-plv-visuals",
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

/** Construit un chemin storage préfixé par l'organisation : `{orgId}/segment1/segment2`. */
export function orgStoragePath(organizationId: string, ...segments: string[]): string {
  const tail = segments.map((s) => s.replace(/^\/+|\/+$/g, "")).filter(Boolean);
  return [organizationId, ...tail].join("/");
}

/** Vérifie si le 1er segment du chemin est un UUID d'organisation valide. */
export function isOrgPrefixedStoragePath(path: string): boolean {
  const first = path.split("/")[0]?.trim() ?? "";
  return UUID_SEGMENT_RE.test(first);
}

/** Valeur héritée (URL publique absolue) vs chemin storage relatif au bucket. */
export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Extrait bucket + chemin relatif depuis une valeur `bucket:path` (optionnel). */
export function parseStorageReference(
  storedValue: string,
  defaultBucket: StorageBucket,
): { bucket: StorageBucket; path: string } {
  const trimmed = storedValue.trim();
  const colon = trimmed.indexOf(":");
  if (colon > 0 && !trimmed.startsWith("http")) {
    const maybeBucket = trimmed.slice(0, colon) as StorageBucket;
    if ((STORAGE_BUCKETS as readonly string[]).includes(maybeBucket)) {
      return { bucket: maybeBucket, path: trimmed.slice(colon + 1) };
    }
  }
  return { bucket: defaultBucket, path: trimmed };
}
