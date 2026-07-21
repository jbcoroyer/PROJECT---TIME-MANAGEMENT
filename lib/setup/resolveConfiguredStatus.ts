/** Fusionne les deux sources de vérité pour is_configured (évite les blocages setup). */
export function resolveConfiguredStatus(input: {
  accessConfigured: boolean;
  brandingConfigured: boolean;
}): boolean {
  return input.accessConfigured || input.brandingConfigured;
}
