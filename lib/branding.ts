import type { Metadata } from "next";
import {
  DEFAULT_PRINT_SPECIES,
  DEFAULT_SOCIAL_THEMATICS,
  parsePrintSpecies,
  parseSocialThematics,
  type PrintSpeciesOption,
} from "./taxonomies";

/** @deprecated Utiliser organization_id ; conservé pour rétro-compat des lignes historiques. */
export const APP_SETTINGS_ID = "default" as const;

export type AppBranding = {
  appName: string;
  appShortName: string;
  tagline: string;
  logoUrl: string | null;
  iconUrl: string | null;
  markUrl: string | null;
  primaryColor: string;
  locale: string;
  timezone: string;
  sector: string | null;
  outlookCategoryName: string;
  defaultPublicSurveyId: string | null;
  isConfigured: boolean;
  socialThematics: string[];
  printSpecies: PrintSpeciesOption[];
};

export type AppSettingsRow = {
  id: string;
  idena_mark_url?: string | null;
  app_name?: string | null;
  app_short_name?: string | null;
  tagline?: string | null;
  logo_url?: string | null;
  icon_url?: string | null;
  mark_url?: string | null;
  primary_color?: string | null;
  locale?: string | null;
  timezone?: string | null;
  sector?: string | null;
  outlook_category_name?: string | null;
  default_public_survey_id?: string | null;
  is_configured?: boolean | null;
  organization_id?: string | null;
  social_thematics?: unknown;
  print_species?: unknown;
  updated_at?: string | null;
};

export type AppBrandingPatch = Partial<{
  appName: string;
  appShortName: string;
  tagline: string;
  logoUrl: string | null;
  iconUrl: string | null;
  markUrl: string | null;
  primaryColor: string;
  locale: string;
  timezone: string;
  sector: string | null;
  outlookCategoryName: string;
  defaultPublicSurveyId: string | null;
  isConfigured: boolean;
  socialThematics: string[];
  printSpecies: PrintSpeciesOption[];
}>;

const NEUTRAL_PRIMARY = "#2563eb";
const DEFAULT_OUTLOOK_CATEGORY = "Planification";

function envString(...keys: string[]): string | null {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return null;
}

/** Pictogramme : nouvelle variable env, alias rétro-compatible IDENA. */
export function getAppMarkSrcFromEnv(): string | null {
  return envString("NEXT_PUBLIC_APP_MARK_SRC", "NEXT_PUBLIC_IDENA_MARK_SRC");
}

export function isExternalImageSrc(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

function envBrandingDefaults(): AppBranding {
  return {
    appName: envString("NEXT_PUBLIC_APP_NAME") ?? "Workspace",
    appShortName: envString("NEXT_PUBLIC_APP_SHORT_NAME", "NEXT_PUBLIC_APP_NAME") ?? "Workspace",
    tagline: envString("NEXT_PUBLIC_APP_TAGLINE") ?? "",
    logoUrl: envString("NEXT_PUBLIC_APP_LOGO_SRC"),
    iconUrl: envString("NEXT_PUBLIC_APP_ICON_SRC"),
    markUrl: getAppMarkSrcFromEnv(),
    primaryColor: envString("NEXT_PUBLIC_APP_PRIMARY_COLOR") ?? NEUTRAL_PRIMARY,
    locale: envString("NEXT_PUBLIC_APP_LOCALE") ?? "fr",
    timezone: envString("NEXT_PUBLIC_APP_TIMEZONE", "MS_TIMEZONE") ?? "Europe/Paris",
    sector: envString("NEXT_PUBLIC_APP_SECTOR"),
    outlookCategoryName: envString("MS_OUTLOOK_CATEGORY_NAME") ?? DEFAULT_OUTLOOK_CATEGORY,
    defaultPublicSurveyId: envString("NEXT_PUBLIC_DEFAULT_PUBLIC_SURVEY_ID"),
    isConfigured: false,
    socialThematics: [...DEFAULT_SOCIAL_THEMATICS],
    printSpecies: [...DEFAULT_PRINT_SPECIES],
  };
}

export const DEFAULT_BRANDING: AppBranding = envBrandingDefaults();

function pickString(
  db: string | null | undefined,
  env: string | null | undefined,
  fallback: string,
): string {
  const fromDb = typeof db === "string" ? db.trim() : "";
  if (fromDb) return fromDb;
  const fromEnv = typeof env === "string" ? env.trim() : "";
  if (fromEnv) return fromEnv;
  return fallback;
}

function pickNullable(
  db: string | null | undefined,
  env: string | null | undefined,
): string | null {
  const fromDb = typeof db === "string" ? db.trim() : "";
  if (fromDb) return fromDb;
  const fromEnv = typeof env === "string" ? env.trim() : "";
  return fromEnv || null;
}

export function mapAppSettingsRow(row: unknown): AppSettingsRow {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id ?? APP_SETTINGS_ID),
    idena_mark_url: typeof r.idena_mark_url === "string" ? r.idena_mark_url : null,
    app_name: typeof r.app_name === "string" ? r.app_name : null,
    app_short_name: typeof r.app_short_name === "string" ? r.app_short_name : null,
    tagline: typeof r.tagline === "string" ? r.tagline : null,
    logo_url: typeof r.logo_url === "string" ? r.logo_url : null,
    icon_url: typeof r.icon_url === "string" ? r.icon_url : null,
    mark_url: typeof r.mark_url === "string" ? r.mark_url : null,
    primary_color: typeof r.primary_color === "string" ? r.primary_color : null,
    locale: typeof r.locale === "string" ? r.locale : null,
    timezone: typeof r.timezone === "string" ? r.timezone : null,
    sector: typeof r.sector === "string" ? r.sector : null,
    outlook_category_name:
      typeof r.outlook_category_name === "string" ? r.outlook_category_name : null,
    default_public_survey_id:
      typeof r.default_public_survey_id === "string" ? r.default_public_survey_id : null,
    is_configured: typeof r.is_configured === "boolean" ? r.is_configured : null,
    social_thematics: r.social_thematics,
    print_species: r.print_species,
    updated_at: typeof r.updated_at === "string" ? r.updated_at : null,
  };
}

/** Fusionne base → variables d'environnement → défauts neutres. */
export function mergeBranding(row: AppSettingsRow | null | undefined): AppBranding {
  const env = envBrandingDefaults();
  const legacyMark =
    row?.mark_url?.trim() ||
    row?.idena_mark_url?.trim() ||
    null;

  return {
    appName: pickString(row?.app_name, env.appName, "Workspace"),
    appShortName: pickString(row?.app_short_name, env.appShortName, "Workspace"),
    tagline: pickString(row?.tagline, env.tagline, ""),
    logoUrl: pickNullable(row?.logo_url, env.logoUrl),
    iconUrl: pickNullable(row?.icon_url, env.iconUrl),
    markUrl: pickNullable(legacyMark, env.markUrl),
    primaryColor: pickString(row?.primary_color, env.primaryColor, NEUTRAL_PRIMARY),
    locale: pickString(row?.locale, env.locale, "fr"),
    timezone: pickString(row?.timezone, env.timezone, "Europe/Paris"),
    sector: pickNullable(row?.sector, env.sector),
    outlookCategoryName: pickString(
      row?.outlook_category_name,
      env.outlookCategoryName,
      DEFAULT_OUTLOOK_CATEGORY,
    ),
    defaultPublicSurveyId: pickNullable(row?.default_public_survey_id, env.defaultPublicSurveyId),
    isConfigured: row?.is_configured === true,
    socialThematics: parseSocialThematics(row?.social_thematics),
    printSpecies: parsePrintSpecies(row?.print_species),
  };
}

export function brandingToMetadata(branding: AppBranding): Metadata {
  const description =
    branding.tagline.trim() !== ""
      ? `${branding.appName} — ${branding.tagline}`
      : `${branding.appName} — gestion de projet, événements et communication.`;

  return {
    title: {
      default: branding.appName,
      template: `%s | ${branding.appName}`,
    },
    description,
    applicationName: branding.appShortName,
    ...(branding.iconUrl ? { icons: { icon: branding.iconUrl } } : {}),
  };
}

export function brandingToDbPatch(
  patch: AppBrandingPatch,
  organizationId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: organizationId,
    organization_id: organizationId,
    updated_at: new Date().toISOString(),
  };
  if (patch.appName !== undefined) row.app_name = patch.appName;
  if (patch.appShortName !== undefined) row.app_short_name = patch.appShortName;
  if (patch.tagline !== undefined) row.tagline = patch.tagline;
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl;
  if (patch.iconUrl !== undefined) row.icon_url = patch.iconUrl;
  if (patch.markUrl !== undefined) {
    row.mark_url = patch.markUrl;
    row.idena_mark_url = patch.markUrl;
  }
  if (patch.primaryColor !== undefined) row.primary_color = patch.primaryColor;
  if (patch.locale !== undefined) row.locale = patch.locale;
  if (patch.timezone !== undefined) row.timezone = patch.timezone;
  if (patch.sector !== undefined) row.sector = patch.sector;
  if (patch.outlookCategoryName !== undefined) {
    row.outlook_category_name = patch.outlookCategoryName;
  }
  if (patch.defaultPublicSurveyId !== undefined) {
    row.default_public_survey_id = patch.defaultPublicSurveyId;
  }
  if (patch.isConfigured !== undefined) row.is_configured = patch.isConfigured;
  if (patch.socialThematics !== undefined) row.social_thematics = patch.socialThematics;
  if (patch.printSpecies !== undefined) row.print_species = patch.printSpecies;
  return row;
}

export function htmlLangFromBranding(locale: string): string {
  const base = locale.trim().split(/[-_]/)[0];
  return base || "fr";
}
