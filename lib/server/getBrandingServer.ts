import {
  mapAppSettingsRow,
  mergeBranding,
  type AppBranding,
} from "../branding";
import { getServerAuthUser } from "./authSafe";
import { getPublicBrandingOrganizationId, getServerOrgContext } from "./orgContext";
import { createServerSupabase } from "./supabaseServer";
import { createServerSignedStorageUrl } from "./storageSignedUrl";

const APP_SETTINGS_SELECT =
  "id, organization_id, idena_mark_url, app_name, app_short_name, tagline, logo_url, icon_url, mark_url, primary_color, locale, timezone, sector, outlook_category_name, default_public_survey_id, is_configured, social_thematics, print_species, enabled_modules, inventory_categories, stock_onboarding_completed, updated_at";

/** Lecture serveur (pages, metadata, actions) — filtrée par RLS / organisation courante. */
export async function getBrandingServer(): Promise<AppBranding> {
  try {
    const supabase = await createServerSupabase();
    const user = await getServerAuthUser(supabase);
    const ctx = await getServerOrgContext();

    // Profil pas encore visible : ne pas lire le branding « legacy » (évite redirects incohérents).
    if (user && !ctx) {
      return mergeBranding(null);
    }

    let query = supabase.from("app_settings").select(APP_SETTINGS_SELECT);

    if (!ctx) {
      query = query.eq("organization_id", getPublicBrandingOrganizationId());
    }

    const { data, error } = await query.maybeSingle();

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

/** Branding avec URLs storage résolues (signées 5 min) pour affichage serveur. */
export async function getBrandingServerResolved(): Promise<AppBranding> {
  const branding = await getBrandingServer();
  const markSigned = await createServerSignedStorageUrl("idena-mark", branding.markUrl);
  return {
    ...branding,
    markUrl: markSigned ?? branding.markUrl,
  };
}
