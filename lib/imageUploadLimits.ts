/** Limite des Server Actions Next.js (corps de requête) pour les uploads d'images. */
export const SERVER_ACTION_IMAGE_MAX_BYTES = 1 * 1024 * 1024;

export const SERVER_ACTION_IMAGE_MAX_MB = 1;

export function isImageWithinServerActionLimit(
  file: File,
  maxBytes = SERVER_ACTION_IMAGE_MAX_BYTES,
): boolean {
  return file.size > 0 && file.size <= maxBytes;
}
