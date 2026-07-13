import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestOrgsAndUsers,
  requireSupabaseTestEnv,
  signInAs,
  type TenantTestUsers,
} from "./testHelpers";

const env = requireSupabaseTestEnv();
const HAS_REMOTE_SUPABASE = Boolean(env);

describe.skipIf(!HAS_REMOTE_SUPABASE)("app_settings — isolation multi-tenant", () => {
  let users: TenantTestUsers | undefined;

  beforeAll(async () => {
    users = await createTestOrgsAndUsers(env!.admin, "settings");
  }, 60_000);

  afterAll(async () => {
    await users?.cleanup();
  }, 60_000);

  it("User A ne lit pas les réglages de User B", async () => {
    const { error: settingsAError } = await env!.admin.from("app_settings").upsert(
      {
        id: users!.orgAId,
        organization_id: users!.orgAId,
        app_name: `${users!.prefix} Workspace A`,
        app_short_name: "A",
        is_configured: true,
      },
      { onConflict: "organization_id" },
    );
    expect(settingsAError).toBeNull();

    const { error: settingsBError } = await env!.admin.from("app_settings").upsert(
      {
        id: users!.orgBId,
        organization_id: users!.orgBId,
        app_name: `${users!.prefix} Workspace B`,
        app_short_name: "B",
        is_configured: true,
      },
      { onConflict: "organization_id" },
    );
    expect(settingsBError).toBeNull();

    const clientA = await signInAs(env!, users!.userAEmail, users!.userAPassword);

    const { data: rowsA, error: selectAError } = await clientA
      .from("app_settings")
      .select("organization_id, app_name")
      .eq("organization_id", users!.orgBId);

    expect(selectAError).toBeNull();
    expect(rowsA ?? []).toHaveLength(0);

    const { data: ownRows, error: ownError } = await clientA
      .from("app_settings")
      .select("organization_id, app_name")
      .eq("organization_id", users!.orgAId);

    expect(ownError).toBeNull();
    expect(ownRows).toHaveLength(1);
    expect(ownRows?.[0]?.app_name).toContain("Workspace A");
  }, 60_000);
});
