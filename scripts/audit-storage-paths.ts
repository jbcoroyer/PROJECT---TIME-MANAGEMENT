/**
 * Audit one-shot : liste les objets storage dont le chemin ne commence PAS
 * par un UUID d'organization_id valide (fichiers orphelins à migrer).
 *
 * Usage:
 *   npx tsx scripts/audit-storage-paths.ts
 *   npm run audit:storage
 *
 * Requiert .env.local : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { STORAGE_BUCKETS } from "../lib/storagePaths";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const UUID_SEGMENT_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch {
    /* ignore */
  }
}

function isValidOrgPrefix(name: string): boolean {
  const first = name.split("/")[0]?.trim() ?? "";
  return UUID_SEGMENT_RE.test(first);
}

type OrphanRow = {
  bucket: string;
  path: string;
  size: number | null;
  updatedAt: string | null;
};

async function listAllObjects(
  admin: SupabaseClient,
  bucket: string,
  prefix = "",
): Promise<OrphanRow[]> {
  const orphans: OrphanRow[] = [];
  let offset = 0;
  const limit = 1000;

  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`[audit] Erreur list ${bucket}/${prefix}:`, error.message);
      break;
    }

    const entries = data ?? [];
    if (entries.length === 0) break;

    for (const entry of entries) {
      const entryName = entry.name ?? "";
      if (!entryName) continue;

      const fullPath = prefix ? `${prefix}/${entryName}` : entryName;

      // Dossier : récursion (id null = dossier dans l'API Supabase)
      if (entry.id === null) {
        const nested = await listAllObjects(admin, bucket, fullPath);
        orphans.push(...nested);
        continue;
      }

      if (!isValidOrgPrefix(fullPath)) {
        orphans.push({
          bucket,
          path: fullPath,
          size: (entry.metadata as { size?: number } | undefined)?.size ?? null,
          updatedAt: entry.updated_at ?? null,
        });
      }
    }

    if (entries.length < limit) break;
    offset += limit;
  }

  return orphans;
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("❌ Variables manquantes : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("🔍 Audit des chemins storage (fichiers sans préfixe organization_id UUID)\n");

  const allOrphans: OrphanRow[] = [];

  for (const bucket of STORAGE_BUCKETS) {
    process.stdout.write(`  Bucket ${bucket}… `);
    const orphans = await listAllObjects(admin, bucket);
    allOrphans.push(...orphans);
    console.log(`${orphans.length} orphelin(s)`);
  }

  console.log(`\n📋 Total : ${allOrphans.length} fichier(s) à migrer avant policy stricte\n`);

  if (allOrphans.length === 0) {
    console.log("✅ Tous les objets respectent la convention {organization_id}/…");
    return;
  }

  console.log("bucket | path | size | updated_at");
  console.log("-".repeat(80));
  for (const row of allOrphans) {
    console.log(
      `${row.bucket} | ${row.path} | ${row.size ?? "?"} | ${row.updatedAt ?? "?"}`,
    );
  }

  console.log(
    "\n💡 Migrez chaque fichier vers `{organization_id}/…` puis relancez cet audit.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
