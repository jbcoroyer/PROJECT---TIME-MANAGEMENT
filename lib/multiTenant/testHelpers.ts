import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const LEGACY_ORG_ID = "00000000-0000-0000-0000-000000000001";

export type SupabaseTestEnv = {
  url: string;
  serviceKey: string;
  anonKey: string;
  admin: SupabaseClient;
};

export type TenantTestUsers = {
  prefix: string;
  orgAId: string;
  orgBId: string;
  userAId: string;
  userBId: string;
  userAEmail: string;
  userBEmail: string;
  userAPassword: string;
  userBPassword: string;
  cleanup: () => Promise<void>;
};

export function requireSupabaseTestEnv(): SupabaseTestEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey || !anonKey) {
    return null;
  }

  return {
    url,
    serviceKey,
    anonKey,
    admin: createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

export async function signInAs(env: SupabaseTestEnv, email: string, password: string) {
  const client = createClient(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw error ?? new Error(`Connexion impossible pour ${email}`);
  }
  return createClient(env.url, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

export async function createTestOrgsAndUsers(
  admin: SupabaseClient,
  label: string,
): Promise<TenantTestUsers> {
  const prefix = `mt-${label}-${Date.now()}`;
  const userAEmail = `${prefix}-a@example.com`;
  const userBEmail = `${prefix}-b@example.com`;
  const userAPassword = `Test-${prefix}-A!`;
  const userBPassword = `Test-${prefix}-B!`;

  const { data: orgA, error: orgAError } = await admin
    .from("organizations")
    .insert({ name: `${prefix} Org A`, slug: `${prefix}-a` })
    .select("id")
    .single();
  if (orgAError) throw orgAError;

  const { data: orgB, error: orgBError } = await admin
    .from("organizations")
    .insert({ name: `${prefix} Org B`, slug: `${prefix}-b` })
    .select("id")
    .single();
  if (orgBError) throw orgBError;

  const { data: userA, error: userAError } = await admin.auth.admin.createUser({
    email: userAEmail,
    password: userAPassword,
    email_confirm: true,
  });
  if (userAError || !userA.user) throw userAError ?? new Error("Création user A impossible");

  const { data: userB, error: userBError } = await admin.auth.admin.createUser({
    email: userBEmail,
    password: userBPassword,
    email_confirm: true,
  });
  if (userBError || !userB.user) throw userBError ?? new Error("Création user B impossible");

  const userAId = userA.user.id;
  const userBId = userB.user.id;

  const { data: profileA } = await admin
    .from("profiles")
    .select("team_member_id")
    .eq("id", userAId)
    .single();
  const { data: profileB } = await admin
    .from("profiles")
    .select("team_member_id")
    .eq("id", userBId)
    .single();

  if (profileA?.team_member_id) {
    await admin.from("team_members").update({ organization_id: orgA.id }).eq("id", profileA.team_member_id);
  }
  if (profileB?.team_member_id) {
    await admin.from("team_members").update({ organization_id: orgB.id }).eq("id", profileB.team_member_id);
  }

  const { error: profileAError } = await admin
    .from("profiles")
    .update({ organization_id: orgA.id, role: "admin" })
    .eq("id", userAId);
  if (profileAError) throw profileAError;

  const { error: profileBError } = await admin
    .from("profiles")
    .update({ organization_id: orgB.id, role: "admin" })
    .eq("id", userBId);
  if (profileBError) throw profileBError;

  await admin.from("organization_members").upsert(
    [
      { user_id: userAId, organization_id: orgA.id, role: "admin" },
      { user_id: userBId, organization_id: orgB.id, role: "admin" },
    ],
    { onConflict: "user_id,organization_id" },
  );

  return {
    prefix,
    orgAId: orgA.id,
    orgBId: orgB.id,
    userAId,
    userBId,
    userAEmail,
    userBEmail,
    userAPassword,
    userBPassword,
    cleanup: async () => {
      await admin.from("organization_members").delete().in("user_id", [userAId, userBId]);
      await admin.from("profiles").delete().in("id", [userAId, userBId]);
      await admin.auth.admin.deleteUser(userAId);
      await admin.auth.admin.deleteUser(userBId);
      await admin.from("organizations").delete().in("id", [orgA.id, orgB.id]);
    },
  };
}
