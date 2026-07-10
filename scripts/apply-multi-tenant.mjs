/**
 * Applique les migrations multi-tenant (fondation + pilote inventory_items).
 * Usage: node scripts/apply-multi-tenant.mjs
 * Requiert .env.local : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optionnel : SUPABASE_DB_PASSWORD pour exécution SQL directe (pooler).
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const MIGRATION_FILES = [
  "supabase/migrations/20260710140000_multi_tenant_foundation.sql",
  "supabase/migrations/20260710150000_multi_tenant_inventory_items.sql",
  "supabase/migrations/20260710160000_multi_tenant_remaining_tables.sql",
  "supabase/migrations/20260710170000_multi_tenant_enforce_fix.sql",
];

const FULL_SQL = MIGRATION_FILES.map((file) =>
  readFileSync(resolve(root, file), "utf8"),
).join("\n\n");

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
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
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

async function verifyOrganizationsTable() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?select=id&slug=eq.legacy&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    },
  );
  return { ok: res.ok, status: res.status, body: await res.text() };
}

async function main() {
  console.log("=== Multi-tenant — application migrations ===\n");

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local");
    process.exit(1);
  }

  console.log("1) Application SQL (fondation + inventory_items)…");
  let applied = await runSqlViaPooler(FULL_SQL);
  if (!applied.ok && ACCESS_TOKEN) {
    console.log("   Pooler:", applied.reason);
    console.log("   Tentative via Management API…");
    applied = await runSqlViaManagementApi(FULL_SQL);
  }
  if (!applied.ok) {
    console.log("   Pooler:", applied.reason);
    if (!ACCESS_TOKEN) {
      console.log("   Management API: SUPABASE_ACCESS_TOKEN manquant");
    }
    console.log("\n   → Ajoutez SUPABASE_DB_PASSWORD dans .env.local puis relancez.");
    console.log("     Ou exécutez manuellement dans Supabase SQL Editor :");
    for (const file of MIGRATION_FILES) {
      console.log(`       ${file}`);
    }
    process.exit(1);
  }
  console.log("   SQL appliqué via", applied.host);

  console.log("\n2) Vérification table organizations…");
  const check = await verifyOrganizationsTable();
  console.log("   legacy org:", check.ok ? "OK" : `échec ${check.status}`, check.body?.slice(0, 120) ?? "");

  if (!check.ok) {
    process.exit(1);
  }

  console.log("\n✅ Migrations multi-tenant appliquées. Lancez : npm test -- lib/multiTenant/inventoryIsolation.test.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
