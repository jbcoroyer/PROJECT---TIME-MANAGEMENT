import type { SupabaseClient } from "@supabase/supabase-js";
import { isStockVisualFile } from "./stockVisualUtils";
import { uploadOrgFile } from "./storageClient";

const BUCKET = "stock-plv-visuals" as const;

export async function uploadStockVisual(
  supabase: SupabaseClient,
  organizationId: string,
  file: File,
  folder: "print" | "goodies" | "plv",
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  if (!organizationId) {
    return { url: null, path: null, error: "Organisation introuvable." };
  }
  if (!isStockVisualFile(file)) {
    return { url: null, path: null, error: "Format non pris en charge. Utilisez une image ou un PDF." };
  }

  const extRaw = file.name.split(".").pop() ?? (file.type === "application/pdf" ? "pdf" : "png");
  const ext = extRaw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
  const contentType = file.type || (ext === "pdf" ? "application/pdf" : "image/png");
  const relativePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const result = await uploadOrgFile(supabase, BUCKET, organizationId, relativePath, file, {
    upsert: true,
    contentType,
  });

  if (!result.ok) {
    return { url: null, path: null, error: result.error };
  }

  return { url: result.signedUrl, path: result.path, error: null };
}
