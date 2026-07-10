import "server-only";

import { createSupabaseAdmin } from "./supabaseAdmin";
import {
  isHttpUrl,
  parseStorageReference,
  SIGNED_URL_TTL_SECONDS,
  type StorageBucket,
} from "../storagePaths";

/** URL signée côté serveur (pages publiques, branding avant connexion). */
export async function createServerSignedStorageUrl(
  bucket: StorageBucket,
  storedValue: string | null | undefined,
  expiresIn = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  if (!storedValue?.trim()) return null;
  if (isHttpUrl(storedValue)) return storedValue;

  const admin = createSupabaseAdmin();
  const { bucket: resolvedBucket, path } = parseStorageReference(storedValue, bucket);
  const { data, error } = await admin.storage
    .from(resolvedBucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    console.warn("[storage] signed URL:", error?.message);
    return null;
  }

  return data.signedUrl;
}
