import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isHttpUrl,
  orgStoragePath,
  parseStorageReference,
  SIGNED_URL_TTL_SECONDS,
  type StorageBucket,
} from "./storagePaths";

export type UploadOrgFileOptions = {
  upsert?: boolean;
  contentType?: string;
};

export type UploadOrgFileResult =
  | { ok: true; path: string; signedUrl: string }
  | { ok: false; error: string };

/**
 * Upload un fichier dans le bucket, chemin préfixé par organizationId.
 * Retourne le chemin storage et une URL signée (5 min) pour affichage immédiat.
 */
export async function uploadOrgFile(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  organizationId: string,
  relativePath: string,
  file: File | Blob,
  options?: UploadOrgFileOptions,
): Promise<UploadOrgFileResult> {
  if (!organizationId) {
    return { ok: false, error: "Organisation introuvable pour l'upload." };
  }

  const path = orgStoragePath(organizationId, relativePath);
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: options?.upsert ?? false,
    contentType: options?.contentType,
  });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const signed = await createSignedStorageUrl(supabase, bucket, path);
  if (!signed.ok) {
    return { ok: false, error: signed.error };
  }

  return { ok: true, path, signedUrl: signed.url };
}

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
