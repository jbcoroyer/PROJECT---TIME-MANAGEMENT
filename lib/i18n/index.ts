import { en } from "./messages/en";
import { es } from "./messages/es";
import { fr, type MessageTree } from "./messages/fr";

export type AppLocale = "fr" | "en" | "es";

const catalogs: Record<AppLocale, MessageTree> = { fr, en, es };

/** Normalise une locale (fr, fr-FR, en-US, es-ES…) vers fr, en ou es. */
export function resolveLocale(value: string | null | undefined): AppLocale {
  const base = (value ?? "").trim().split(/[-_]/)[0]?.toLowerCase();
  if (base === "en") return "en";
  if (base === "es") return "es";
  return "fr";
}

/** Détecte la langue du navigateur (côté client uniquement). */
export function detectBrowserLocale(): AppLocale {
  // Node 22+ expose navigator sans window — ne pas s’y fier hors navigateur.
  if (typeof window === "undefined") return "fr";
  return resolveLocale(navigator.language);
}

function getNested(messages: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export function t(
  locale: AppLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = getNested(catalogs[locale], key);
  if (primary) return interpolate(primary, vars);
  const fallback = getNested(catalogs.fr, key);
  return fallback ? interpolate(fallback, vars) : key;
}

export function createTranslator(locale: AppLocale) {
  return (key: string, vars?: Record<string, string | number>) => t(locale, key, vars);
}

export const LOCALE_OPTIONS: { value: AppLocale; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];
