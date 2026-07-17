import { STORAGE_BUCKETS, isOrgPrefixedStoragePath, type StorageBucket } from "./storagePaths";
import { SERVER_ACTION_IMAGE_MAX_BYTES } from "./imageUploadLimits";

const MAX_BYTES_BY_BUCKET: Record<StorageBucket, number> = {
  "idena-mark": SERVER_ACTION_IMAGE_MAX_BYTES,
  "member-avatars": SERVER_ACTION_IMAGE_MAX_BYTES,
  "company-logos": SERVER_ACTION_IMAGE_MAX_BYTES,
  "event-documents": 15 * 1024 * 1024,
  "social-post-visuals": 10 * 1024 * 1024,
  "stock-plv-visuals": 15 * 1024 * 1024,
};

export function isStorageBucket(value: string): value is StorageBucket {
  return (STORAGE_BUCKETS as readonly string[]).includes(value);
}

/** Segments relatifs sûrs : pas de `..`, pas de backslash, caractères limités. */
export function sanitizeRelativeStoragePath(relativePath: string): string | null {
  const trimmed = relativePath.replace(/^\/+/, "").trim();
  if (!trimmed || trimmed.includes("\\") || trimmed.includes("..")) return null;

  const segments = trimmed.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const safe = segments.every((segment) => /^[a-zA-Z0-9._-]+$/.test(segment));
  if (!safe) return null;

  return segments.join("/");
}

export function maxUploadBytesForBucket(bucket: StorageBucket): number {
  return MAX_BYTES_BY_BUCKET[bucket];
}

export function assertOrgPrefixedPath(orgId: string, path: string): boolean {
  if (!isOrgPrefixedStoragePath(path)) return false;
  return path.split("/")[0]?.toLowerCase() === orgId.trim().toLowerCase();
}
