"use server";

import { revalidatePath } from "next/cache";
import {
  brandingToDbPatch,
  mergeBranding,
  mapAppSettingsRow,
  type AppBrandingPatch,
} from "../../lib/branding";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { createServerSupabase } from "../../lib/server/supabaseServer";

export type UpdateBrandingResult = { ok: true } | { ok: false; error: string };

const APP_SETTINGS_SELECT =
  "id, organization_id, idena_mark_url, app_name, app_short_name, tagline, logo_url, icon_url, mark_url, primary_color, locale, timezone, sector, outlook_category_name, default_public_survey_id, is_configured, social_thematics, print_species, enabled_modules, inventory_categories, stock_onboarding_completed, updated_at";

async function requireAdminOrg(): Promise<
  { ok: true; organizationId: string } | { ok: false; error: string }
> {
  const ctx = await getServerOrgContext();
  if (!ctx) return { ok: false, error: "Vous devez être connecté." };
  if (!ctx.isAdmin) return { ok: false, error: "Action réservée aux administrateurs." };
  return { ok: true, organizationId: ctx.organizationId };
}

/** Met à jour la configuration de l'organisation courante (admin uniquement). */
export async function updateBranding(patch: AppBrandingPatch): Promise<UpdateBrandingResult> {
  const auth = await requireAdminOrg();
  if (!auth.ok) return auth;

  const supabase = await createServerSupabase();
  const row = brandingToDbPatch(patch, auth.organizationId);
  const { error } = await supabase.from("app_settings").upsert(row, { onConflict: "organization_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Lecture serveur pour actions (config de l'organisation courante). */
export async function getBrandingAction() {
  const ctx = await getServerOrgContext();
  if (!ctx) return mergeBranding(null);

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("app_settings")
    .select(APP_SETTINGS_SELECT)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  return mergeBranding(data ? mapAppSettingsRow(data) : null);
}
