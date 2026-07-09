"use client";

import { useMemo } from "react";
import { useBranding } from "../brandingContext";
import { createTranslator, detectBrowserLocale, resolveLocale, type AppLocale } from "./index";

type UseTranslationOptions = {
  /** Avant la configuration initiale, utilise la langue du navigateur. */
  preferBrowser?: boolean;
};

export function useTranslation(options?: UseTranslationOptions) {
  const { branding, loading } = useBranding();

  const locale: AppLocale = useMemo(() => {
    if (options?.preferBrowser && !branding.isConfigured && !loading) {
      return detectBrowserLocale();
    }
    return resolveLocale(branding.locale);
  }, [branding.isConfigured, branding.locale, loading, options?.preferBrowser]);

  const translate = useMemo(() => createTranslator(locale), [locale]);

  return { t: translate, locale };
}
