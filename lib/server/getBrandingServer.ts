import {
  APP_SETTINGS_ID,
  mapAppSettingsRow,
  mergeBranding,
  type AppBranding,
} from "../branding";
import { createServerSupabase } from "./supabaseServer";

const APP_SETTINGS_SELECT =
  "id, idena_mark_url, app_name, app_short_name, tagline, logo_url, icon_url, mark_url, primary_color, locale, timezone, sector, outlook_category_name, default_public_survey_id, is_configured, social_thematics, print_species, updated_at";

/** Lecture serveur (pages, metadata, actions). */
export async function getBrandingServer(): Promise<AppBranding> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("app_settings")
      .select(APP_SETTINGS_SELECT)
      .eq("id", APP_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.warn("[branding] app_settings:", error.message);
      return mergeBranding(null);
    }

    return mergeBranding(data ? mapAppSettingsRow(data) : null);
  } catch (e) {
    console.warn("[branding] getBrandingServer:", e);
    return mergeBranding(null);
  }
}
