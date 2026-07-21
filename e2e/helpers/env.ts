import { requireSupabaseTestEnv } from "../../lib/multiTenant/testHelpers";

/** Supabase réel (pas les clés factices CI). */
export function getLiveSupabaseEnv() {
  const env = requireSupabaseTestEnv();
  if (!env) return null;
  if (env.url.includes("example.supabase.co")) return null;
  if (env.serviceKey === "test-service-role-key") return null;
  return env;
}

export function getPlaywrightBaseUrl() {
  return (process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
