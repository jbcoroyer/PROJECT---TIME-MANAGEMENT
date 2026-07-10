"use server";

import { revalidatePath } from "next/cache";
import {
  brandingToDbPatch,
  type AppBrandingPatch,
} from "../../lib/branding";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { createServerSupabase } from "../../lib/server/supabaseServer";

export type SetupAccess = {
  isConfigured: boolean;
  isAuthenticated: boolean;
  canCompleteSetup: boolean;
  isAdmin: boolean;
  organizationId: string | null;
};

async function countAdminsForOrg(organizationId: string): Promise<number> {
  try {
    const admin = createSupabaseAdmin();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("organization_id", organizationId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Indique si l'utilisateur courant peut lancer ou terminer l'installation de son organisation. */
export async function getSetupAccess(): Promise<SetupAccess> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctx = await getServerOrgContext();
  const organizationId = ctx?.organizationId ?? null;

  let isConfigured = false;
  if (organizationId) {
    const { data } = await supabase
      .from("app_settings")
      .select("is_configured")
      .eq("organization_id", organizationId)
      .maybeSingle();
    isConfigured = data?.is_configured === true;
  }

  const isAuthenticated = Boolean(user);
  const isAdmin = ctx?.isAdmin ?? false;

  let canCompleteSetup = false;
  if (isAuthenticated && organizationId && !isConfigured) {
    if (isAdmin) {
      canCompleteSetup = true;
    } else {
      const adminCount = await countAdminsForOrg(organizationId);
      canCompleteSetup = adminCount === 0;
    }
  }

  return { isConfigured, isAuthenticated, canCompleteSetup, isAdmin, organizationId };
}

export type CompleteSetupResult = { ok: true } | { ok: false; error: string };

/** Enregistre la configuration initiale de l'organisation courante. */
export async function completeInitialSetup(
  patch: AppBrandingPatch,
): Promise<CompleteSetupResult> {
  const access = await getSetupAccess();
  if (!access.canCompleteSetup || !access.organizationId) {
    return { ok: false, error: "Vous n'avez pas l'autorisation de finaliser l'installation." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connectez-vous pour continuer." };

  const appName = patch.appName?.trim();
  if (!appName) return { ok: false, error: "Le nom de l'application est obligatoire." };

  const row = brandingToDbPatch(
    {
      ...patch,
      appName,
      appShortName: patch.appShortName?.trim() || appName,
      tagline: patch.tagline?.trim() ?? "",
      isConfigured: true,
    },
    access.organizationId,
  );

  const { error } = await supabase.from("app_settings").upsert(row, { onConflict: "organization_id" });
  if (error) return { ok: false, error: error.message };

  if (!access.isAdmin) {
    const adminCount = await countAdminsForOrg(access.organizationId);
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
