/** Fusion recursive de catalogues i18n (patch ecrase base). */
export function deepMergeMessages<T extends Record<string, unknown>>(
  base: T,
  patch: Partial<T> | Record<string, unknown>,
): T {
  const out = { ...base } as T;
  for (const key of Object.keys(patch)) {
    const patchVal = (patch as Record<string, unknown>)[key];
    const baseVal = (base as Record<string, unknown>)[key];
    if (
      patchVal &&
      typeof patchVal === "object" &&
      !Array.isArray(patchVal) &&
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      (out as Record<string, unknown>)[key] = deepMergeMessages(
        baseVal as Record<string, unknown>,
        patchVal as Record<string, unknown>,
      );
    } else if (patchVal !== undefined) {
      (out as Record<string, unknown>)[key] = patchVal;
    }
  }
  return out;
}
