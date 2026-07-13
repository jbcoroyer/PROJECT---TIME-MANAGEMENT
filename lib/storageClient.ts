import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isHttpUrl,
  parseStorageReference,
  SIGNED_URL_TTL_SECONDS,
  type StorageBucket,
} from "./storagePaths";

export type SignedUrlResult = { ok: true; url: string } | { ok: false; error: string };

/** Génère une URL signée (5 min). Les URLs http(s) existantes sont renvoyées telles quelles. */
export async function createSignedStorageUrl(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  storedValue: string,
  expiresIn = SIGNED_URL_TTL_SECONDS,
): Promise<SignedUrlResult> {
  const trimmed = storedValue.trim();
  if (!trimmed) {
    return { ok: false, error: "Chemin storage vide." };
  }
  if (isHttpUrl(trimmed)) {
    return { ok: true, url: trimmed };
  }

  const { bucket: resolvedBucket, path } = parseStorageReference(trimmed, bucket);
  const { data, error } = await supabase.storage
    .from(resolvedBucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? "URL signée impossible." };
  }

  return { ok: true, url: data.signedUrl };
}

/**
 * Résout une valeur stockée en base (URL legacy ou chemin storage) en URL affichable.
 */
export async function resolveStorageAssetUrl(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  storedValue: string | null | undefined,
): Promise<string | null> {
  if (!storedValue?.trim()) return null;
  const result = await createSignedStorageUrl(supabase, bucket, storedValue);
  return result.ok ? result.url : null;
}

/** Télécharge un fichier via URL signée (ouvre dans un nouvel onglet). */
export async function downloadViaSignedUrl(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  path: string,
  filename?: string,
): Promise<{ ok: boolean; error?: string }> {
  const signed = await createSignedStorageUrl(supabase, bucket, path);
  if (!signed.ok) return { ok: false, error: signed.error };

  if (typeof window !== "undefined") {
    const anchor = document.createElement("a");
    anchor.href = signed.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    if (filename) anchor.download = filename;
    anchor.click();
  }

  return { ok: true };
}
