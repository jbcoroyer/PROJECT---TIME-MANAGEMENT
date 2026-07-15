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

describe.skipIf(!HAS_REMOTE_SUPABASE)("survey_responses — isolation multi-tenant", () => {
  let admin: SupabaseClient;
  let users: TenantTestUsers | undefined;
  let surveyAId: string | null = null;
  let responseAId: string | null = null;

  beforeAll(async () => {
    admin = env!.admin;
    users = await createTestOrgsAndUsers(admin, "survey-resp");

    const { data: survey, error: surveyError } = await admin
      .from("survey_definitions")
      .insert({
        id: `mt-survey-${users.prefix}`,
        title: `${users.prefix} questionnaire`,
        version: `mt-survey-${users.prefix}`,
        status: "active",
        organization_id: users.orgAId,
        definition: {
          version: `mt-survey-${users.prefix}`,
          title: "Test",
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
    if (responseAId) {
      await admin.from("survey_responses").delete().eq("id", responseAId);
    }
    if (surveyAId) {
      await admin.from("survey_definitions").delete().eq("id", surveyAId);
    }
    await users?.cleanup();
  }, 60_000);

  it("User B (admin) ne voit pas les réponses de l'espace A", async () => {
    const { data: response, error: insertError } = await admin
      .from("survey_responses")
      .insert({
        organization_id: users!.orgAId,
        survey_version: surveyAId!,
        answers: { q1: "test" },
      })
      .select("id")
      .single();

    expect(insertError).toBeNull();
    responseAId = response!.id;

    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);

    const { data: rowsB, error: selectBError } = await clientB
      .from("survey_responses")
      .select("id")
      .eq("id", responseAId);

    expect(selectBError).toBeNull();
    expect(rowsB ?? []).toHaveLength(0);
  }, 60_000);
});
