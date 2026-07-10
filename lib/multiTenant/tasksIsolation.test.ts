import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  LEGACY_ORG_ID,
  createTestOrgsAndUsers,
  requireSupabaseTestEnv,
  signInAs,
  type TenantTestUsers,
} from "./testHelpers";

const env = requireSupabaseTestEnv();
const HAS_REMOTE_SUPABASE = Boolean(env);

describe.skipIf(!HAS_REMOTE_SUPABASE)("tasks — isolation multi-tenant", () => {
  let admin: SupabaseClient;
  let users: TenantTestUsers | undefined;
  let taskAId: string | null = null;

  beforeAll(async () => {
    admin = env.admin;
    users = await createTestOrgsAndUsers(admin, "tasks");
  }, 60_000);

  afterAll(async () => {
    if (taskAId) {
      await admin.from("tasks").delete().eq("id", taskAId);
    }
    await users?.cleanup();
  }, 60_000);

  it("User A ne voit pas les tâches de User B", async () => {
    const clientA = await signInAs(env, users.userAEmail, users.userAPassword);

    const { data: inserted, error: insertError } = await clientA
      .from("tasks")
      .insert({
        company: "Test Co",
        domain: "Test",
        admin: "User A",
        column_id: "todo",
        lane: "default",
        description: `${users.prefix} tâche A`,
      })
      .select("id, organization_id")
      .single();

    expect(insertError).toBeNull();
    expect(inserted?.id).toBeTruthy();
    expect(inserted?.organization_id).toBe(users.orgAId);
    taskAId = inserted!.id;

    const clientB = await signInAs(env, users.userBEmail, users.userBPassword);

    const { data: rowsB, error: selectBError } = await clientB
      .from("tasks")
      .select("id")
      .eq("id", taskAId);

    expect(selectBError).toBeNull();
    expect(rowsB ?? []).toHaveLength(0);
  }, 60_000);

  it("les tâches legacy restent sur l'organisation legacy", async () => {
    const { data, error } = await admin
      .from("organizations")
      .select("id, slug")
      .eq("id", LEGACY_ORG_ID)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.slug).toBe("legacy");
  });
});
