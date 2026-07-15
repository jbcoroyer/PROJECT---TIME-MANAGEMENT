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

describe.skipIf(!HAS_REMOTE_SUPABASE)("survey_definitions — isolation multi-tenant", () => {
  let admin: SupabaseClient;
  let users: TenantTestUsers | undefined;
  let surveyAId: string | null = null;

  beforeAll(async () => {
    admin = env!.admin;
    users = await createTestOrgsAndUsers(admin, "survey-def");

    const { data: survey, error: surveyError } = await admin
      .from("survey_definitions")
      .insert({
        id: `mt-survey-def-${users.prefix}`,
        title: `${users.prefix} questionnaire`,
        version: `mt-survey-def-${users.prefix}`,
        status: "active",
        organization_id: users.orgAId,
        definition: {
          version: `mt-survey-def-${users.prefix}`,
          title: "Test",
          intro: { title: "Test", subtitle: "", estimatedMinutes: 1 },
          questions: [],
          steps: [],
        },
      })
      .select("id")
      .single();

    if (surveyError) throw surveyError;
    surveyAId = survey.id;
  }, 60_000);

  afterAll(async () => {
    if (surveyAId) {
      await admin.from("survey_definitions").delete().eq("id", surveyAId);
    }
    await users?.cleanup();
  }, 60_000);

  it("User B (admin) ne voit pas les questionnaires de l'espace A", async () => {
    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);

    const { data: rowsB, error: selectBError } = await clientB
      .from("survey_definitions")
      .select("id")
      .eq("id", surveyAId);

    expect(selectBError).toBeNull();
    expect(rowsB ?? []).toHaveLength(0);
  }, 60_000);

  it("User B ne peut pas lister tous les questionnaires cross-tenant", async () => {
    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);

    const { data: rowsB, error: selectBError } = await clientB
      .from("survey_definitions")
      .select("id");

    expect(selectBError).toBeNull();
    const ids = (rowsB ?? []).map((r) => (r as { id: string }).id);
    expect(ids).not.toContain(surveyAId);
  }, 60_000);
});
