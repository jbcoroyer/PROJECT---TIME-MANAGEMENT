"use server";

import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { requirePlatformAdmin } from "../../lib/server/platformAdmin";

export type PlatformOrgRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  billingStatus: string;
  trialEndsAt: string | null;
  memberCount: number;
  createdAt: string | null;
};

export type ListPlatformOrgsResult =
  | { ok: true; organizations: PlatformOrgRow[]; total: number }
  | { ok: false; error: string };

export async function listPlatformOrganizations(): Promise<ListPlatformOrgsResult> {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) return gate;

  const admin = createSupabaseAdmin();
  const { data: orgs, error } = await admin
    .from("organizations")
    .select("id, name, slug, plan, billing_status, trial_ends_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { ok: false, error: error.message };

  const rows: PlatformOrgRow[] = [];
  for (const org of orgs ?? []) {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id as string);

    rows.push({
      id: org.id as string,
      name: org.name as string,
      slug: org.slug as string,
      plan: org.plan as string,
      billingStatus: org.billing_status as string,
      trialEndsAt: (org.trial_ends_at as string | null) ?? null,
      memberCount: count ?? 0,
      createdAt: (org.created_at as string | null) ?? null,
    });
  }

  return { ok: true, organizations: rows, total: rows.length };
}

export async function canAccessPlatformAdmin(): Promise<boolean> {
  const gate = await requirePlatformAdmin();
  return gate.ok;
}
