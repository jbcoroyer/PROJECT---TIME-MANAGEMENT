import type { SupabaseClient } from "@supabase/supabase-js";
import { isStockVisualFile } from "./stockVisualUtils";
import { createSignedStorageUrl, resolveCurrentOrganizationId } from "./storageClient";

const BUCKET = "stock-plv-visuals" as const;

/**
 * Upload un visuel stock/PLV/print dans le bucket, chemin préfixé par l'organisation courante.
 * L'organization_id est lu depuis profiles via la session Supabase.
 */
export async function uploadStockVisual(
  supabase: SupabaseClient,
  file: File,
  folder: "print" | "goodies" | "plv",
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  const organizationId = await resolveCurrentOrganizationId(supabase);
  if (!organizationId) {
    return { url: null, path: null, error: "Organisation introuvable." };
  }
  if (!isStockVisualFile(file)) {
    return { url: null, path: null, error: "Format non pris en charge. Utilisez une image ou un PDF." };
  }

  const extRaw = file.name.split(".").pop() ?? (file.type === "application/pdf" ? "pdf" : "png");
  const ext = extRaw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
  const contentType = file.type || (ext === "pdf" ? "application/pdf" : "image/png");

  // Convention : {organizationId}/{folder}/{timestamp}-{uuid}.{ext}
  const path = `${organizationId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType,
  });

  if (upErr) {
    return { url: null, path: null, error: upErr.message };
  }

  const signed = await createSignedStorageUrl(supabase, BUCKET, path);
  if (!signed.ok) {
    return { url: null, path, error: signed.error };
  }

  return { url: signed.url, path, error: null };
}
