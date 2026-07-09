"use server";

import { revalidatePath } from "next/cache";
import {
  APP_SETTINGS_ID,
  brandingToDbPatch,
  mergeBranding,
  mapAppSettingsRow,
  type AppBrandingPatch,
} from "../../lib/branding";
import { createServerSupabase } from "../../lib/server/supabaseServer";

export type UpdateBrandingResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Action réservée aux administrateurs." };
  }

  return { ok: true };
}

/** Met à jour la configuration organisation (admin uniquement). */
export async function updateBranding(patch: AppBrandingPatch): Promise<UpdateBrandingResult> {
  const supabase = await createServerSupabase();
  const auth = await requireAdmin(supabase);
  if (!auth.ok) return auth;

  const row = brandingToDbPatch(patch);
  const { error } = await supabase.from("app_settings").upsert(row, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Lecture serveur pour actions (retourne la config fusionnée). */
export async function getBrandingAction() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("app_settings")
    .select(
      "id, idena_mark_url, app_name, app_short_name, tagline, logo_url, icon_url, mark_url, primary_color, locale, timezone, sector, outlook_category_name, default_public_survey_id, is_configured, social_thematics, print_species",
    )
    .eq("id", APP_SETTINGS_ID)
    .maybeSingle();

  return mergeBranding(data ? mapAppSettingsRow(data) : null);
}
