"use server";

import { revalidatePath } from "next/cache";
import { brandingToDbPatch } from "../../lib/branding";
import type { StockCategoryOption } from "../../lib/stockCategories";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { createServerSupabase } from "../../lib/server/supabaseServer";

export type StockSettingsResult = { ok: true } | { ok: false; error: string };

async function requireOrgMember(): Promise<
  { ok: true; organizationId: string } | { ok: false; error: string }
> {
  const ctx = await getServerOrgContext();
  if (!ctx) return { ok: false, error: "Vous devez être connecté." };
  return { ok: true, organizationId: ctx.organizationId };
}

/** Termine l'onboarding stock : enregistre les catégories choisies et débloque le module. */
export async function completeStockOnboarding(
  categories: StockCategoryOption[],
): Promise<StockSettingsResult> {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth;

  const cleaned = categories
    .map((c) => ({
      value: c.value.trim(),
      label: c.label.trim() || c.value.trim(),
    }))
    .filter((c) => c.value.length > 0 && c.label.length > 0);

  if (cleaned.length === 0) {
    return { ok: false, error: "Sélectionnez au moins une catégorie de stock." };
  }

  const supabase = await createServerSupabase();
  const row = brandingToDbPatch(
    {
      inventoryCategories: cleaned,
      stockOnboardingCompleted: true,
    },
    auth.organizationId,
  );

  const { error } = await supabase.from("app_settings").upsert(row, { onConflict: "organization_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/stock", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Met à jour les catégories stock (admin ou post-onboarding). */
export async function updateStockCategories(
  categories: StockCategoryOption[],
): Promise<StockSettingsResult> {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth;

  const cleaned = categories
    .map((c) => ({
      value: c.value.trim(),
      label: c.label.trim() || c.value.trim(),
    }))
    .filter((c) => c.value.length > 0 && c.label.length > 0);

  if (cleaned.length === 0) {
    return { ok: false, error: "Au moins une catégorie est requise." };
  }

  const supabase = await createServerSupabase();
  const row = brandingToDbPatch({ inventoryCategories: cleaned }, auth.organizationId);
  const { error } = await supabase.from("app_settings").upsert(row, { onConflict: "organization_id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/stock", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}
