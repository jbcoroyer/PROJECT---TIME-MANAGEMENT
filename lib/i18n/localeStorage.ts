import { resolveLocale, type AppLocale } from "./index";

export const LOCALE_STORAGE_KEY = "ws-locale";

export function readStoredLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (!raw) return null;
  return resolveLocale(raw);
}

export function writeStoredLocale(locale: AppLocale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}
