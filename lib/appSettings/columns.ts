/**
 * Colonnes lues depuis public.app_settings — source unique pour éviter la dérive schéma/code.
 * Mettre à jour cette liste + une migration SQL à chaque nouvelle colonne.
 * Vérification : npm run audit:app-settings
 */
export const APP_SETTINGS_COLUMNS = [
  "id",
  "organization_id",
  "idena_mark_url",
  "app_name",
  "app_short_name",
  "tagline",
  "logo_url",
  "icon_url",
  "mark_url",
  "primary_color",
  "locale",
  "timezone",
  "sector",
  "outlook_category_name",
  "default_public_survey_id",
  "is_configured",
  "social_thematics",
  "print_species",
  "enabled_modules",
  "inventory_categories",
  "stock_onboarding_completed",
  "agenda_intro_completed",
  "updated_at",
] as const;

/** Colonnes ajoutées après la base initiale — repli si migration pas encore appliquée. */
export const APP_SETTINGS_OPTIONAL_COLUMNS = [
  "inventory_categories",
  "stock_onboarding_completed",
  "agenda_intro_completed",
] as const;

export const APP_SETTINGS_SELECT = APP_SETTINGS_COLUMNS.join(", ");

export const APP_SETTINGS_CORE_SELECT = APP_SETTINGS_COLUMNS.filter(
  (col) => !(APP_SETTINGS_OPTIONAL_COLUMNS as readonly string[]).includes(col),
).join(", ");

export type AppSettingsColumn = (typeof APP_SETTINGS_COLUMNS)[number];
