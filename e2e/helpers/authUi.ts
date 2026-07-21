import { expect, type Page } from "@playwright/test";

async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole("button", { name: /essential only|accept all|tout accepter|essentiels/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await dismissCookieBanner(page);
  await page.getByLabel(/adresse email|e-?mail/i).fill(email);
  await page.locator("#signin-password").fill(password);
  await page.getByRole("button", { name: /se connecter|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 25_000 });
}

export async function expectNotSetupBlocked(page: Page) {
  await expect(page.getByRole("heading", { name: /installation en attente|setup pending/i })).toHaveCount(
    0,
  );
}

export async function expectSetupWizard(page: Page) {
  await expect(page).toHaveURL(/\/setup/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: /your organization|votre organisation|organización/i }),
  ).toBeVisible();
  await expectNotSetupBlocked(page);
}
