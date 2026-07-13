import { isStockVisualFile } from "./stockVisualUtils";
import { uploadOrgAsset } from "../app/actions/storage";

/**
 * Upload un visuel stock/PLV/print via server action (service role + validation).
 */
export async function uploadStockVisual(
  file: File,
  folder: "print" | "goodies" | "plv",
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  if (!isStockVisualFile(file)) {
    return { url: null, path: null, error: "Format non pris en charge. Utilisez une image ou un PDF." };
  }

  const extRaw = file.name.split(".").pop() ?? (file.type === "application/pdf" ? "pdf" : "png");
  const ext = extRaw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
  const relativePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const formData = new FormData();
  formData.set("file", file);
  const upload = await uploadOrgAsset(formData, "stock-plv-visuals", relativePath);

  if (!upload.ok) {
    return { url: null, path: null, error: upload.error };
  }

  return { url: upload.signedUrl, path: upload.path, error: null };
}
