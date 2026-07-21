import type { SupabaseClient } from "@supabase/supabase-js";
import { mapAppSettingsRow, type AppSettingsRow } from "../branding";
import { APP_SETTINGS_CORE_SELECT, APP_SETTINGS_SELECT } from "./columns";

type SettingsQueryError = { message?: string; code?: string } | null;

/** Erreur Postgres « colonne inexistante » (migration manquante). */
export function isSchemaColumnError(error: SettingsQueryError): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /column .+ does not exist/i.test(error.message ?? "");
}

function rowFromData(data: unknown): AppSettingsRow | null {
  if (!data || typeof data !== "object") return null;
  return mapAppSettingsRow(data as Record<string, unknown>);
}

/**
 * Lit app_settings pour une organisation avec repli sur le select « core »
 * si une colonne récente n'existe pas encore en base (évite isConfigured=false par erreur).
 */
export async function fetchAppSettingsRow(
  client: SupabaseClient,
  organizationId: string,
  options?: { logLabel?: string },
): Promise<{ row: AppSettingsRow | null; usedFallback: boolean }> {
  const label = options?.logLabel ?? "app_settings";

  const full = await client
    .from("app_settings")
    .select(APP_SETTINGS_SELECT)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!full.error) {
    return { row: rowFromData(full.data), usedFallback: false };
  }

  if (isSchemaColumnError(full.error)) {
    console.warn(`[${label}] colonne manquante, repli select core:`, full.error.message);
    const core = await client
      .from("app_settings")
      .select(APP_SETTINGS_CORE_SELECT)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!core.error) {
      return { row: rowFromData(core.data), usedFallback: true };
    }
    console.warn(`[${label}] repli core échoué:`, core.error.message);
    return { row: null, usedFallback: true };
  }

  console.warn(`[${label}] lecture impossible:`, full.error.message);
  return { row: null, usedFallback: false };
}

/** Lecture fiable de is_configured (prioritaire pour les décisions de routing). */
export async function fetchOrganizationIsConfigured(
  client: SupabaseClient,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("app_settings")
    .select("is_configured")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    console.warn("[app_settings] is_configured:", error.message);
    return false;
  }

  return data?.is_configured === true;
}
