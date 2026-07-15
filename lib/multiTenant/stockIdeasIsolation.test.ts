import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestOrgsAndUsers,
  requireSupabaseTestEnv,
  signInAs,
  type TenantTestUsers,
} from "./testHelpers";

const env = requireSupabaseTestEnv();
const HAS_REMOTE_SUPABASE = Boolean(env);

describe.skipIf(!HAS_REMOTE_SUPABASE)("stock_ideas — isolation multi-tenant", () => {
  let admin: SupabaseClient;
  let users: TenantTestUsers | undefined;
  let ideaAId: string | null = null;

  beforeAll(async () => {
    admin = env!.admin;
    users = await createTestOrgsAndUsers(admin, "stock-ideas");
  }, 60_000);

  afterAll(async () => {
    if (ideaAId) {
      await admin.from("stock_ideas").delete().eq("id", ideaAId);
    }
    await users?.cleanup();
  }, 60_000);

  it("User A ne voit pas les idées de User B", async () => {
    const clientA = await signInAs(env!, users!.userAEmail, users!.userAPassword);

    const { data: inserted, error: insertError } = await clientA
      .from("stock_ideas")
      .insert({
        title: `${users!.prefix} idée A`,
        category: "autre",
        status: "nouveau",
      })
      .select("id, organization_id")
      .single();

    expect(insertError).toBeNull();
    expect(inserted?.id).toBeTruthy();
    expect(inserted?.organization_id).toBe(users!.orgAId);
    ideaAId = inserted!.id;

    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);

    const { data: rowsB, error: selectBError } = await clientB
      .from("stock_ideas")
      .select("id")
      .eq("id", ideaAId);

    expect(selectBError).toBeNull();
    expect(rowsB ?? []).toHaveLength(0);
  }, 60_000);
});
