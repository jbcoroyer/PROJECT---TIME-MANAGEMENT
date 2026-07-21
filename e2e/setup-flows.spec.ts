import { expect, test } from "@playwright/test";
import { expectNotSetupBlocked, expectSetupWizard, loginViaUI } from "./helpers/authUi";
import { getLiveSupabaseEnv, getPlaywrightBaseUrl } from "./helpers/env";
import {
  SetupTestFixture,
  createFreshAdminUser,
  createInvitedMember,
  generateMagicLink,
  markOrganizationConfigured,
} from "./helpers/setupUsers";

const liveSupabase = getLiveSupabaseEnv();

test.describe("Parcours setup / auth (Supabase live)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(!liveSupabase, "Supabase live requis (NEXT_PUBLIC_SUPABASE_URL + clés réelles).");
    testInfo.setTimeout(90_000);
  });

  test("nouveau compte admin → assistant d'installation (pas de blocage)", async ({ page }) => {
    const fixture = SetupTestFixture.open();
    if (!fixture) test.skip();

    const admin = await createFreshAdminUser(fixture!.admin, "new-admin");
    fixture!.trackUser(admin.userId);
    fixture!.trackOrg(admin.orgId);

    try {
      await loginViaUI(page, admin.email, admin.password);
      await expect(page).toHaveURL(/\/setup/, { timeout: 20_000 });
      await expectSetupWizard(page);
    } finally {
      await fixture!.cleanup();
    }
  });

  test("admin configuré → accès app, /setup redirige", async ({ page }) => {
    const fixture = SetupTestFixture.open();
    if (!fixture) test.skip();

    const admin = await createFreshAdminUser(fixture!.admin, "configured-admin");
    fixture!.trackUser(admin.userId);
    fixture!.trackOrg(admin.orgId);
    await markOrganizationConfigured(fixture!.admin, admin.orgId);

    try {
      await loginViaUI(page, admin.email, admin.password);
      await expect(page).not.toHaveURL(/\/setup/, { timeout: 20_000 });
      await expectNotSetupBlocked(page);

      await page.goto("/setup");
      await expect(page).not.toHaveURL(/\/setup$/, { timeout: 15_000 });
      await expectNotSetupBlocked(page);
    } finally {
      await fixture!.cleanup();
    }
  });

  test("membre invité → complétion profil puis accès app", async ({ page }) => {
    const fixture = SetupTestFixture.open();
    if (!fixture) test.skip();

    const owner = await createFreshAdminUser(fixture!.admin, "invite-owner");
    fixture!.trackUser(owner.userId);
    fixture!.trackOrg(owner.orgId);
    await markOrganizationConfigured(fixture!.admin, owner.orgId);

    const invitee = await createInvitedMember(
      fixture!.admin,
      owner.orgId,
      owner.userId,
      "member",
    );
    fixture!.trackUser(invitee.userId);

    try {
      await loginViaUI(page, invitee.email, invitee.password);
      await expect(page).toHaveURL(/\/invite\/accept/, { timeout: 20_000 });

      await page.locator("#invite-first-name").fill("Jean");
      await page.locator("#invite-last-name").fill("Dupont");
      await page.getByRole("button", { name: /rejoindre l'espace|join/i }).click();

      await expect(page).toHaveURL(/\/dashboard\/kanban/, { timeout: 25_000 });
      await expectNotSetupBlocked(page);
    } finally {
      await fixture!.cleanup();
    }
  });

  test("reconnexion OAuth simulée (magic link) → setup sans écran en attente", async ({ page }) => {
    const fixture = SetupTestFixture.open();
    if (!fixture) test.skip();

    const admin = await createFreshAdminUser(fixture!.admin, "oauth-return");
    fixture!.trackUser(admin.userId);
    fixture!.trackOrg(admin.orgId);

    const baseUrl = getPlaywrightBaseUrl();
    const magicLink = await generateMagicLink(
      fixture!.admin,
      admin.email,
      `${baseUrl}/auth/callback?next=/setup`,
    );

    try {
      await page.goto(magicLink);
      await expect(page).toHaveURL(/\/setup/, { timeout: 25_000 });
      await expectSetupWizard(page);
    } finally {
      await fixture!.cleanup();
    }
  });
});
