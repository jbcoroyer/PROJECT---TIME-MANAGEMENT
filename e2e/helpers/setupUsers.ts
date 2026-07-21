import type { SupabaseClient } from "@supabase/supabase-js";
import { getLiveSupabaseEnv } from "./env";

export type SetupTestUser = {
  userId: string;
  email: string;
  password: string;
  orgId: string;
};

export type InvitedTestUser = {
  userId: string;
  email: string;
  password: string;
};

export class SetupTestFixture {
  readonly admin: SupabaseClient;
  private readonly userIds = new Set<string>();
  private readonly orgIds = new Set<string>();

  private constructor(admin: SupabaseClient) {
    this.admin = admin;
  }

  static open(): SetupTestFixture | null {
    const env = getLiveSupabaseEnv();
    if (!env) return null;
    return new SetupTestFixture(env.admin);
  }

  trackUser(userId: string) {
    this.userIds.add(userId);
  }

  trackOrg(orgId: string) {
    this.orgIds.add(orgId);
  }

  async cleanup() {
    for (const userId of this.userIds) {
      try {
        await this.admin.auth.admin.deleteUser(userId);
      } catch {
        /* ignore */
      }
    }
    for (const orgId of this.orgIds) {
      try {
        await this.admin.from("organizations").delete().eq("id", orgId);
      } catch {
        /* ignore */
      }
    }
  }
}

async function waitForProfileOrganizationId(
  admin: SupabaseClient,
  userId: string,
  maxMs = 10_000,
): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const { data } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();
    const orgId = data?.organization_id as string | null | undefined;
    if (orgId) return orgId;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Profil non provisionné pour ${userId}`);
}

export async function createFreshAdminUser(
  admin: SupabaseClient,
  label: string,
): Promise<SetupTestUser> {
  const stamp = `${label}-${Date.now()}`;
  const email = `e2e-${stamp}@example.com`;
  const password = `E2e-${stamp}-Pass1!`;
  const orgName = `E2E ${label}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: "E2E Admin",
      organization_name: orgName,
    },
  });
  if (error || !data.user) {
    throw error ?? new Error(`Impossible de créer l'utilisateur E2E (${label})`);
  }

  const orgId = await waitForProfileOrganizationId(admin, data.user.id);
  return { userId: data.user.id, email, password, orgId };
}

export async function markOrganizationConfigured(admin: SupabaseClient, orgId: string) {
  const { error } = await admin
    .from("app_settings")
    .update({ is_configured: true })
    .eq("organization_id", orgId);
  if (error) throw error;
}

export async function createInvitedMember(
  admin: SupabaseClient,
  orgId: string,
  inviterUserId: string,
  label: string,
): Promise<InvitedTestUser> {
  const stamp = `${label}-${Date.now()}`;
  const email = `e2e-invite-${stamp}@example.com`;
  const password = `E2e-Invite-${stamp}-Pass1!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      organization_id: orgId,
      role: "user",
      invited: true,
      invited_by_user_id: inviterUserId,
      invited_by_name: "E2E Admin",
      workspace_name: "E2E Workspace",
      display_name: "Invité E2E",
    },
  });
  if (error || !data.user) {
    throw error ?? new Error(`Impossible de créer le membre invité (${label})`);
  }

  await waitForProfileOrganizationId(admin, data.user.id);
  return { userId: data.user.id, email, password };
}

export async function generateMagicLink(admin: SupabaseClient, email: string, redirectTo: string) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (error || !data.properties?.action_link) {
    throw error ?? new Error("Impossible de générer le lien magiclink");
  }
  return data.properties.action_link;
}
