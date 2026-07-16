"use client";

import { useMemo } from "react";
import { useBranding } from "../brandingContext";
import {
  createTranslator,
  detectBrowserLocale,
  resolveLocale,
  type AppLocale,
} from "./index";
import { readStoredLocale } from "./localeStorage";

type UseTranslationOptions = {
  /** Avant la configuration initiale, utilise la langue du navigateur. */
  preferBrowser?: boolean;
  /** Force une locale (ex. aperçu pendant l'onboarding). */
  localeOverride?: AppLocale;
};

export function useTranslation(options?: UseTranslationOptions) {
  const { branding, loading } = useBranding();
  const preferBrowser = options?.preferBrowser;
  const localeOverride = options?.localeOverride;

  const locale: AppLocale = useMemo(() => {
    if (localeOverride) return resolveLocale(localeOverride);
    if (preferBrowser) {
      const stored = readStoredLocale();
      if (stored) return stored;
      if (!branding.isConfigured && !loading) return detectBrowserLocale();
    }
    return resolveLocale(branding.locale);
  }, [
    branding.isConfigured,
    branding.locale,
    loading,
    localeOverride,
    preferBrowser,
  ]);

  const translate = useMemo(() => createTranslator(locale), [locale]);

  return { t: translate, locale };
}
