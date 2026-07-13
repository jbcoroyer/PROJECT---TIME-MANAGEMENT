"use server";

import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { getServerOrgContext } from "../../lib/server/orgContext";

export type GdprActionResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string };

export async function exportMyPersonalData(): Promise<GdprActionResult> {
  const ctx = await getServerOrgContext();
  if (!ctx) return { ok: false, error: "Non authentifié." };

  const admin = createSupabaseAdmin();
  const { data: authUser } = await admin.auth.admin.getUserById(ctx.userId);
  const { data: profile } = await admin
    .from("profiles")
    .select("id, display_name, role, organization_id, team_member_id, created_at")
    .eq("id", ctx.userId)
    .maybeSingle();

  const { data: tasks } = await admin
    .from("tasks")
    .select("id, project_name, description, lane, is_archived, created_at, updated_at")
    .eq("organization_id", ctx.organizationId)
    .limit(500);

  return {
    ok: true,
    payload: {
      exportedAt: new Date().toISOString(),
      account: {
        email: authUser.user?.email ?? null,
        createdAt: authUser.user?.created_at ?? null,
      },
      profile,
      tasks: tasks ?? [],
    },
  };
}

export async function exportOrganizationData(): Promise<GdprActionResult> {
  const ctx = await getServerOrgContext();
  if (!ctx?.isAdmin) {
    return { ok: false, error: "Seul un administrateur peut exporter les données de l'organisation." };
  }

  const admin = createSupabaseAdmin();
  const orgId = ctx.organizationId;

  const [orgRes, profilesRes, tasksRes, settingsRes] = await Promise.all([
    admin.from("organizations").select("*").eq("id", orgId).maybeSingle(),
    admin.from("profiles").select("id, display_name, role, team_member_id, created_at").eq("organization_id", orgId),
    admin.from("tasks").select("id, project_name, description, lane, is_archived, created_at").eq("organization_id", orgId).limit(2000),
    admin.from("app_settings").select("*").eq("organization_id", orgId).maybeSingle(),
  ]);

  return {
    ok: true,
    payload: {
      exportedAt: new Date().toISOString(),
      organization: orgRes.data,
      profiles: profilesRes.data ?? [],
      tasks: tasksRes.data ?? [],
      settings: settingsRes.data,
    },
  };
}

export async function requestAccountDeletion(): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getServerOrgContext();
  if (!ctx) return { ok: false, error: "Non authentifié." };

  const admin = createSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(ctx.userId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
