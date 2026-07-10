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

describe.skipIf(!HAS_REMOTE_SUPABASE)("inventory_items — isolation multi-tenant", () => {
  let users: TenantTestUsers | undefined;
  let itemAId: string | null = null;

  beforeAll(async () => {
    users = await createTestOrgsAndUsers(env!.admin, "inventory");
  }, 60_000);

  afterAll(async () => {
    if (itemAId) {
      await env!.admin.from("inventory_items").delete().eq("id", itemAId);
    }
    await users?.cleanup();
  }, 60_000);

  it("User A ne voit pas les articles de User B (et inversement)", async () => {
    const clientA = await signInAs(env!, users!.userAEmail, users!.userAPassword);

    const { data: inserted, error: insertError } = await clientA
      .from("inventory_items")
      .insert({
        category: "Goodies",
        item_type: "test",
        name: `${users!.prefix} article A`,
        quantity: 1,
        unit_price: 0,
        alert_threshold: 0,
      })
      .select("id")
      .single();

    expect(insertError).toBeNull();
    expect(inserted?.id).toBeTruthy();
    itemAId = inserted!.id;

    const { data: rowsA, error: selectAError } = await clientA
      .from("inventory_items")
      .select("id, organization_id")
      .eq("id", itemAId);

    expect(selectAError).toBeNull();
    expect(rowsA).toHaveLength(1);
    expect(rowsA?.[0]?.organization_id).toBe(users!.orgAId);

    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);

    const { data: rowsB, error: selectBError } = await clientB
      .from("inventory_items")
      .select("id")
      .eq("id", itemAId);

    expect(selectBError).toBeNull();
    expect(rowsB ?? []).toHaveLength(0);
  }, 60_000);

  it("les données legacy restent sur l'organisation legacy", async () => {
    const { data, error } = await env!.admin
      .from("organizations")
      .select("id, slug")
      .eq("id", LEGACY_ORG_ID)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.slug).toBe("legacy");
  });
});
