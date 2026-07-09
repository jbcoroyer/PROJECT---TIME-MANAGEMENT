"use server";

import { revalidatePath } from "next/cache";
import {
  APP_SETTINGS_ID,
  brandingToDbPatch,
  type AppBrandingPatch,
} from "../../lib/branding";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";

export type SetupAccess = {
  isConfigured: boolean;
  isAuthenticated: boolean;
  canCompleteSetup: boolean;
  isAdmin: boolean;
};

async function countAdmins(): Promise<number> {
  try {
    const admin = createSupabaseAdmin();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Indique si l'utilisateur courant peut lancer ou terminer l'installation. */
export async function getSetupAccess(): Promise<SetupAccess> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("app_settings")
    .select("is_configured")
    .eq("id", APP_SETTINGS_ID)
    .maybeSingle();

  const isConfigured = data?.is_configured === true;
  const isAuthenticated = Boolean(user);

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  let canCompleteSetup = false;
  if (isAuthenticated && !isConfigured) {
    if (isAdmin) {
      canCompleteSetup = true;
    } else {
      const adminCount = await countAdmins();
      canCompleteSetup = adminCount === 0;
    }
  }

  return { isConfigured, isAuthenticated, canCompleteSetup, isAdmin };
}

export type CompleteSetupResult = { ok: true } | { ok: false; error: string };

/** Enregistre la configuration initiale et marque l'application comme installée. */
export async function completeInitialSetup(
  patch: AppBrandingPatch,
): Promise<CompleteSetupResult> {
  const access = await getSetupAccess();
  if (!access.canCompleteSetup) {
    return { ok: false, error: "Vous n'avez pas l'autorisation de finaliser l'installation." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour continuer." };

  const appName = patch.appName?.trim();
  if (!appName) return { ok: false, error: "Le nom de l'application est obligatoire." };

  const row = brandingToDbPatch({
    ...patch,
    appName,
    appShortName: patch.appShortName?.trim() || appName,
    tagline: patch.tagline?.trim() ?? "",
    isConfigured: true,
  });

  const { error } = await supabase.from("app_settings").upsert(row, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  if (!access.isAdmin) {
    const adminCount = await countAdmins();
    if (adminCount === 0) {
      try {
        const admin = createSupabaseAdmin();
        await admin.from("profiles").update({ role: "admin" }).eq("id", user.id);
      } catch (e) {
        console.warn("[setup] promotion admin:", e);
      }
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
