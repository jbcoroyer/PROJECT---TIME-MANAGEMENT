/**
 * Applique la migration app_settings per-org.
 * Usage: node scripts/apply-app-settings-per-org.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const key = t.slice(0, i).trim();
      const val = t.slice(i + 1).trim();
      process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnvLocal();
// Évite qu'un ancien mot de passe shell écrase .env.local
delete process.env.SUPABASE_DB_PASSWORD;
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const SQL = readFileSync(
  resolve(root, "supabase/migrations/20260710180000_app_settings_per_org.sql"),
  "utf8",
);

async function runSqlViaManagementApi(sql) {
  if (!ACCESS_TOKEN || !PROJECT_REF) {
    return { ok: false, reason: "SUPABASE_ACCESS_TOKEN manquant" };
  }
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const body = await res.text();
  if (!res.ok) {
    return { ok: false, reason: `${res.status} ${body.slice(0, 240)}` };
  }
  return { ok: true, host: "api.supabase.com" };
}

async function runSqlViaPooler(sql) {
  if (!DB_PASSWORD || !PROJECT_REF) {
    return { ok: false, reason: "SUPABASE_DB_PASSWORD manquant" };
  }
  const { default: pg } = await import("pg");
  const hosts = [
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  ];
  let lastErr;
  for (const connectionString of hosts) {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      await client.query(sql);
      await client.query("NOTIFY pgrst, 'reload schema'");
      await client.end();
      return { ok: true, host: connectionString.split("@")[1] };
    } catch (e) {
      lastErr = e;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  return { ok: false, reason: lastErr?.message ?? "connexion pooler impossible" };
}

async function main() {
  console.log("=== app_settings per-org ===\n");

  let applied = await runSqlViaPooler(SQL);
  if (!applied.ok && ACCESS_TOKEN) {
    console.log("Pooler:", applied.reason);
    applied = await runSqlViaManagementApi(SQL);
  }
  if (!applied.ok) {
    console.error("Échec:", applied.reason);
    process.exit(1);
  }

  console.log("✅ Migration appliquée via", applied.host);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
