/**
 * Migration one-shot des chemins storage orphelins vers l'organisation legacy.
 *
 * Tout fichier dont le 1er segment n'est PAS un UUID d'organisation valide
 * est déplacé sous : 00000000-0000-0000-0000-000000000001/{ancien_chemin}
 *
 * Usage:
 *   node scripts/migrate-storage-paths.mjs
 *   npm run migrate:storage
 *
 * Requiert .env.local : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const LEGACY_ORG_ID = "00000000-0000-0000-0000-000000000001";

const STORAGE_BUCKETS = [
  "idena-mark",
  "member-avatars",
  "company-logos",
  "event-documents",
  "social-post-visuals",
  "stock-plv-visuals",
];

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

function isValidOrgPrefix(name) {
  const first = name.split("/")[0]?.trim() ?? "";
  return UUID_SEGMENT_RE.test(first);
}

function legacyTargetPath(oldPath) {
  if (oldPath.startsWith(`${LEGACY_ORG_ID}/`)) return null;
  return `${LEGACY_ORG_ID}/${oldPath}`;
}

/** Liste récursive de tous les fichiers (pas les dossiers). */
async function listAllFiles(admin, bucket, prefix = "") {
  const files = [];
  let offset = 0;
  const limit = 1000;

  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`  [list] ${bucket}/${prefix}:`, error.message);
      break;
    }

    const entries = data ?? [];
    if (entries.length === 0) break;

    for (const entry of entries) {
      const name = entry.name ?? "";
      if (!name) continue;
      const fullPath = prefix ? `${prefix}/${name}` : name;

      if (entry.id === null) {
        const nested = await listAllFiles(admin, bucket, fullPath);
        files.push(...nested);
        continue;
      }

      files.push({ path: fullPath, size: entry.metadata?.size ?? null });
    }

    if (entries.length < limit) break;
    offset += limit;
  }

  return files;
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

  console.log("📦 Migration des chemins storage vers l'org legacy\n");
  console.log(`   Cible : ${LEGACY_ORG_ID}/{ancien_chemin}\n`);

  const report = {
    scanned: 0,
    alreadyOk: 0,
    moved: 0,
    failed: 0,
    moves: [],
  };

  for (const bucket of STORAGE_BUCKETS) {
    console.log(`\n── Bucket : ${bucket} ──`);
    const files = await listAllFiles(admin, bucket);
    report.scanned += files.length;

    const orphans = files.filter((f) => !isValidOrgPrefix(f.path));
    const ok = files.length - orphans.length;
    report.alreadyOk += ok;

    console.log(`   ${files.length} fichier(s) — ${ok} déjà préfixés, ${orphans.length} à migrer`);

    for (const file of orphans) {
      const newPath = legacyTargetPath(file.path);
      if (!newPath) continue;

      console.log(`   → ${file.path}  ⇒  ${newPath}`);

      const { error } = await admin.storage.from(bucket).move(file.path, newPath);

      if (error) {
        console.error(`     ✗ Échec : ${error.message}`);
        report.failed += 1;
        report.moves.push({ bucket, from: file.path, to: newPath, ok: false, error: error.message });
      } else {
        report.moved += 1;
        report.moves.push({ bucket, from: file.path, to: newPath, ok: true });
      }
    }
  }

  console.log("\n════════════════════════════════════════");
  console.log("RAPPORT AVANT / APRÈS");
  console.log("════════════════════════════════════════");
  console.log(`Fichiers scannés      : ${report.scanned}`);
  console.log(`Déjà conformes        : ${report.alreadyOk}`);
  console.log(`Migrés avec succès    : ${report.moved}`);
  console.log(`Échecs                : ${report.failed}`);
  console.log("════════════════════════════════════════\n");

  if (report.failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
