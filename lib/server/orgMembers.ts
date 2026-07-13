import "server-only";

import { createSupabaseAdmin } from "./supabaseAdmin";

export async function countOrganizationMembers(organizationId: string): Promise<number> {
  const admin = createSupabaseAdmin();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[orgMembers] count", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function listOrganizationMemberEmails(organizationId: string): Promise<string[]> {
  const admin = createSupabaseAdmin();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId);

  if (error || !profiles?.length) return [];

  const emails: string[] = [];
  for (const profile of profiles) {
    const { data } = await admin.auth.admin.getUserById(profile.id as string);
    if (data.user?.email) emails.push(data.user.email);
  }
  return emails;
}

export async function listOrganizationAdminEmails(organizationId: string): Promise<string[]> {
  const admin = createSupabaseAdmin();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("role", "admin");

  if (error || !profiles?.length) return [];

  const emails: string[] = [];
  for (const profile of profiles) {
    const { data } = await admin.auth.admin.getUserById(profile.id as string);
    if (data.user?.email) emails.push(data.user.email);
  }
  return emails;
}
