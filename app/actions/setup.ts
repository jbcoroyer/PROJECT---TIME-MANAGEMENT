"use server";

import { revalidatePath } from "next/cache";
import {
  brandingToDbPatch,
  type AppBrandingPatch,
} from "../../lib/branding";
import type { WorkHours } from "../../lib/agenda/agendaTypes";
import { getSetupAccess } from "../../lib/setup/getSetupAccess";
import { initializeOrgAgendaSettingsForOrg } from "./agenda";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";

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

async function countMembersForOrg(organizationId: string): Promise<number> {
  try {
    const admin = createSupabaseAdmin();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export type CompleteSetupResult = { ok: true } | { ok: false; error: string };

export type CompleteSetupInput = AppBrandingPatch & {
  setupWorkHours?: WorkHours;
};

/** Enregistre la configuration initiale de l'organisation courante. */
export async function completeInitialSetup(
  patch: CompleteSetupInput,
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

  if (patch.enabledModules !== undefined && patch.enabledModules.length === 0) {
    return { ok: false, error: "Sélectionnez au moins un module pour votre espace." };
  }

  const setupWorkHours = patch.setupWorkHours;
  const includesWorkspace = (patch.enabledModules ?? []).includes("workspace");

  const { setupWorkHours: _ignored, ...brandingPatch } = patch;

  const row = brandingToDbPatch(
    {
      ...brandingPatch,
      appName,
      appShortName: patch.appShortName?.trim() || appName,
      tagline: "",
      isConfigured: true,
    },
    access.organizationId,
  );

  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("app_settings").upsert(row, { onConflict: "organization_id" });
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return { ok: false, error: message };
  }

  if (includesWorkspace && setupWorkHours) {
    const agendaResult = await initializeOrgAgendaSettingsForOrg(
      access.organizationId,
      setupWorkHours,
    );
    if (!agendaResult.ok) return agendaResult;
  }

  if (!access.isAdmin) {
    const [adminCount, memberCount] = await Promise.all([
      countAdminsForOrg(access.organizationId),
      countMembersForOrg(access.organizationId),
    ]);
    if (adminCount === 0 || memberCount === 1) {
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
