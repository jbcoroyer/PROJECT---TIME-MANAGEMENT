import { enUS, fr as frLocale } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { AppLocale } from "./index";

const DATE_FNS_LOCALES: Record<AppLocale, Locale> = {
  fr: frLocale,
  en: enUS,
};

export function getDateFnsLocale(locale: AppLocale): Locale {
  return DATE_FNS_LOCALES[locale] ?? frLocale;
}

export function getIntlLocale(locale: AppLocale): string {
  const map: Record<AppLocale, string> = {
    fr: "fr-FR",
    en: "en-US",
  };
  return map[locale] ?? "fr-FR";
}
