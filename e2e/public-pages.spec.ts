import { expect, test } from "@playwright/test";

test.describe("Pages publiques", () => {
  test("affiche la landing marketing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /tarifs|pricing/i }).first()).toBeVisible();
  });

  test("affiche la page tarifs", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Gratuit" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Standard" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
  });

  test("health check répond ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});

test.describe("Auth", () => {
  test("affiche le formulaire de connexion", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /connexion|sign in/i })).toBeVisible();
  });
});
