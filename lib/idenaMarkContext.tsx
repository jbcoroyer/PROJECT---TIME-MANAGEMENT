"use client";

/**
 * @deprecated Utilisez `useBranding()` depuis `lib/brandingContext`.
 * Conservé pour compatibilité le temps des imports restants.
 */
import { useBranding } from "./brandingContext";

export function IdenaMarkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useIdenaMark() {
  const { branding, loading, reload } = useBranding();
  return {
    customSrc: branding.markUrl,
    dbUrl: branding.markUrl,
    loading,
    reload,
  };
}
