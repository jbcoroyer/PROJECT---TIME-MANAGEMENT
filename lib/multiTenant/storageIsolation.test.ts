import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { orgStoragePath } from "../storagePaths";
import {
  createTestOrgsAndUsers,
  requireSupabaseTestEnv,
  signInAs,
  type TenantTestUsers,
} from "./testHelpers";

const env = requireSupabaseTestEnv();
const HAS_REMOTE_SUPABASE = Boolean(env);

const TEST_BUCKET = "member-avatars";

describe.skipIf(!HAS_REMOTE_SUPABASE)("storage — isolation multi-tenant", () => {
  let admin: SupabaseClient;
  let users: TenantTestUsers | undefined;
  let fileAPath: string | null = null;

  beforeAll(async () => {
    admin = env!.admin;
    users = await createTestOrgsAndUsers(admin, "storage");
  }, 60_000);

  afterAll(async () => {
    if (fileAPath) {
      await admin.storage.from(TEST_BUCKET).remove([fileAPath]);
    }
    await users?.cleanup();
  }, 60_000);

  it("User A peut écrire dans son dossier org", async () => {
    const clientA = await signInAs(env!, users!.userAEmail, users!.userAPassword);
    fileAPath = orgStoragePath(users!.orgAId, `test-${users!.prefix}.txt`);

    const body = new Blob([`${users!.prefix} secret`], { type: "text/plain" });
    const { error } = await clientA.storage.from(TEST_BUCKET).upload(fileAPath, body, {
      upsert: true,
      contentType: "text/plain",
    });

    expect(error).toBeNull();
  }, 60_000);

  it("User B ne peut pas lister le dossier de l'org A", async () => {
    expect(fileAPath).toBeTruthy();
    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);

    const { data, error } = await clientB.storage.from(TEST_BUCKET).list(users!.orgAId, { limit: 100 });

    // RLS : soit erreur, soit liste vide (aucun fichier de l'org A visible)
    const names = (data ?? []).map((f) => f.name);
    const leaked = names.some((n) => fileAPath!.endsWith(n));
    expect(leaked).toBe(false);
    if (error) expect(error).toBeTruthy();
  }, 60_000);

  it("User B ne peut pas lire le fichier de l'org A", async () => {
    expect(fileAPath).toBeTruthy();
    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);

    const { data, error } = await clientB.storage.from(TEST_BUCKET).download(fileAPath!);

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  }, 60_000);

  it("User B ne peut pas écrire dans le dossier de l'org A", async () => {
    const clientB = await signInAs(env!, users!.userBEmail, users!.userBPassword);
    const intruderPath = orgStoragePath(users!.orgAId, `intrusion-${users!.prefix}.txt`);
    const body = new Blob(["hack"], { type: "text/plain" });

    const { error } = await clientB.storage.from(TEST_BUCKET).upload(intruderPath, body, {
      upsert: false,
      contentType: "text/plain",
    });

    expect(error).toBeTruthy();

    await admin.storage.from(TEST_BUCKET).remove([intruderPath]);
  }, 60_000);
});
