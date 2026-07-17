import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Run with: npx tsx scripts/audit-i18n-compare.ts
import { fr } from "../lib/i18n/messages/fr";
import { en } from "../lib/i18n/messages/en";
import { es } from "../lib/i18n/messages/es";
import { t } from "../lib/i18n";

const ROOT = process.cwd();
const EXTS = new Set([".ts", ".tsx"]);
const SKIP = new Set(["node_modules", ".next", "dist", "coverage", ".git"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function extractKeys(content: string): Set<string> {
  const keys = new Set<string>();
  const patterns = [
    /\bt\(\s*["']([a-zA-Z][a-zA-Z0-9_.]*)["']/g,
    /\bt\(\s*`([a-zA-Z][a-zA-Z0-9_.]*)`/g,
    /labelKey:\s*["']([a-zA-Z][a-zA-Z0-9_.]*)["']/g,
    /(?:titleKey|subtitleKey|descriptionKey|badgeKey|messagePrefix):\s*["']([a-zA-Z][a-zA-Z0-9_.]*)["']/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) keys.add(m[1]);
  }
  return keys;
}

function getNested(obj: unknown, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object" || !(p in (cur as object))) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

const files = walk(ROOT).filter(
  (f) => !f.includes(`${path.sep}lib${path.sep}i18n${path.sep}messages${path.sep}`),
);

const used = new Set<string>();
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const k of extractKeys(content)) used.add(k);
}

// Expand known dynamic families from configs
const dynamicPrefixes = [
  "firstTaskTutorial.quest.",
  "boardExploration.quest.",
  "modules.",
  "setup.moduleQuiz.",
  "setup.colors.",
  "setup.timezones.",
  "setup.sectors.",
  "dashboard.tabs.",
  "nav.",
  "settings.tabs.",
  "planning.gantt.group.",
  "gamification.badges.",
];

const missingFr: string[] = [];
const missingEn: string[] = [];
const missingEs: string[] = [];

for (const key of [...used].sort()) {
  if (!getNested(fr, key)) missingFr.push(key);
  if (!getNested(en, key)) missingEn.push(key);
  if (!getNested(es, key)) missingEs.push(key);
}

// Also check via t() which falls back to fr then key
const unresolved = [...used].sort().filter((key) => t("fr", key) === key);

const byRoot: Record<string, string[]> = {};
for (const k of unresolved) {
  const root = k.split(".")[0];
  (byRoot[root] ??= []).push(k);
}

console.log("=== SUMMARY ===");
console.log("Used keys:", used.size);
console.log("Missing FR:", missingFr.length);
console.log("Missing EN:", missingEn.length);
console.log("Missing ES:", missingEs.length);
console.log("Unresolved via t(fr):", unresolved.length);
console.log("\n=== BY ROOT ===");
for (const [root, keys] of Object.entries(byRoot).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n[${root}] ${keys.length}`);
  for (const k of keys) console.log(" ", k);
}

fs.writeFileSync(
  path.join(ROOT, ".tmp-missing-i18n.json"),
  JSON.stringify({ missingFr, missingEn, missingEs, unresolved, byRoot }, null, 2),
);
console.log("\nWrote .tmp-missing-i18n.json");
