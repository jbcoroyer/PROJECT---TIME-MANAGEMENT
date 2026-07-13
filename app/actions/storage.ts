"use server";

import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { getServerOrgContext } from "../../lib/server/orgContext";
import {
  orgStoragePath,
  SIGNED_URL_TTL_SECONDS,
  type StorageBucket,
} from "../../lib/storagePaths";
import {
  assertOrgPrefixedPath,
  isStorageBucket,
  maxUploadBytesForBucket,
  sanitizeRelativeStoragePath,
} from "../../lib/storageUploadSecurity";

export type UploadOrgAssetResult =
  | { ok: true; path: string; signedUrl: string }
  | { ok: false; error: string };

/**
 * Upload storage cloisonné par org — contourne le RLS storage via service role
 * après vérification que l'utilisateur appartient à l'organisation.
 */
export async function uploadOrgAsset(
  formData: FormData,
  bucket: StorageBucket,
  relativePath: string,
): Promise<UploadOrgAssetResult> {
  if (!isStorageBucket(bucket)) {
    return { ok: false, error: "Bucket non autorisé." };
  }

  const ctx = await getServerOrgContext();
  if (!ctx) {
    return { ok: false, error: "Connectez-vous pour envoyer un fichier." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fichier invalide." };
  }

  const maxBytes = maxUploadBytesForBucket(bucket);
  if (file.size > maxBytes) {
    return { ok: false, error: `Fichier trop volumineux (max ${Math.round(maxBytes / (1024 * 1024))} Mo).` };
  }

  const safeRelative = sanitizeRelativeStoragePath(relativePath);
  if (!safeRelative) {
    return { ok: false, error: "Chemin de fichier invalide." };
  }

  const path = orgStoragePath(ctx.organizationId, safeRelative);
  if (!assertOrgPrefixedPath(ctx.organizationId, path)) {
    return { ok: false, error: "Chemin storage non autorisé." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const admin = createSupabaseAdmin();
    const { error: upErr } = await admin.storage.from(bucket).upload(path, bytes, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (upErr) {
      return { ok: false, error: upErr.message };
    }

    const { data, error: signErr } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (signErr || !data?.signedUrl) {
      return { ok: false, error: signErr?.message ?? "URL signée impossible." };
    }

    return { ok: true, path, signedUrl: data.signedUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return { ok: false, error: message };
  }
}
