import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestOrgsAndUsers,
  requireSupabaseTestEnv,
  signInAs,
  type TenantTestUsers,
} from "./testHelpers";

const env = requireSupabaseTestEnv();
const HAS_REMOTE_SUPABASE = Boolean(env);

describe.skipIf(!HAS_REMOTE_SUPABASE)("dam_assets — isolation multi-tenant", () => {
  let users: TenantTestUsers | undefined;
  let assetAId: string | null = null;

  beforeAll(async () => {
    users = await createTestOrgsAndUsers(env!.admin, "dam");
  }, 60_000);

  afterAll(async () => {
    if (assetAId) {
      await env!.admin.from("dam_assets").delete().eq("id", assetAId);
    }
    await users?.cleanup();
  }, 60_000);

  it("User A ne voit pas les assets DAM de User B", async () => {
    const clientA = await signInAs(env!, users!.userAEmail, users!.userAPassword);

    const { data: inserted, error: insertError } = await clientA
      .from("dam_assets")
      .insert({
        name: `${users!.prefix} logo`,
        url: "https://example.com/logo.png",
        company: "Test Co",
        type: "Logo",
        tags: ["test"],
      })
      .select("id, organization_id")
      .single();

    expect(insertError).toBeNull();
    expect(inserted?.id).toBeTruthy();
    expect(inserted?.organization_id).toBe(users!.orgAId);
    assetAId = inserted!.id;

    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);

    const { data: rowsB, error: selectBError } = await clientB
      .from("dam_assets")
      .select("id")
      .eq("id", assetAId);

    expect(selectBError).toBeNull();
    expect(rowsB ?? []).toHaveLength(0);
  }, 60_000);
});
