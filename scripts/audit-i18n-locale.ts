import fs from "node:fs";
import path from "node:path";
import { fr } from "../lib/i18n/messages/fr";
import { en } from "../lib/i18n/messages/en";
import { es } from "../lib/i18n/messages/es";
import { t } from "../lib/i18n";
import type { MessageTree } from "../lib/i18n/messages/fr";

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

function flatten(obj: MessageTree, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[next] = v;
    else if (v && typeof v === "object") flatten(v as MessageTree, next, out);
  }
  return out;
}

const files = walk(ROOT).filter(
  (f) => !f.includes(`${path.sep}lib${path.sep}i18n${path.sep}messages${path.sep}`),
);

const used = new Set<string>();
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  for (const k of extractKeys(content)) used.add(k);
}

const frFlat = flatten(fr);
const enFlat = flatten(en);
const esFlat = flatten(es);

const missingEn: string[] = [];
const missingEs: string[] = [];
const enSameAsFr: string[] = [];
const enUnresolved: string[] = [];
const esUnresolved: string[] = [];

for (const key of [...used].sort()) {
  const frVal = getNested(fr, key);
  const enVal = getNested(en, key);
  const esVal = getNested(es, key);
  const tEn = t("en", key);
  const tEs = t("es", key);

  if (!enVal) missingEn.push(key);
  if (!esVal) missingEs.push(key);
  if (enVal && frVal && enVal === frVal) enSameAsFr.push(key);
  if (tEn === key) enUnresolved.push(key);
  if (tEs === key) esUnresolved.push(key);
}

// Keys in FR catalog but not EN (broader than used keys)
const frOnlyKeys = Object.keys(frFlat).filter((k) => !enFlat[k]);
const enOnlyKeys = Object.keys(enFlat).filter((k) => !frFlat[k]);

console.log("=== USED KEYS ===");
console.log("Total used:", used.size);
console.log("Missing EN:", missingEn.length);
console.log("Missing ES:", missingEs.length);
console.log("EN unresolved via t():", enUnresolved.length);
console.log("ES unresolved via t():", esUnresolved.length);
console.log("EN same string as FR (used keys):", enSameAsFr.length);
console.log("FR keys not in EN catalog:", frOnlyKeys.length);
console.log("EN keys not in FR catalog:", enOnlyKeys.length);

function group(keys: string[]) {
  const out: Record<string, string[]> = {};
  for (const k of keys) {
    const root = k.split(".")[0];
    (out[root] ??= []).push(k);
  }
  return out;
}

if (missingEn.length) {
  console.log("\n=== MISSING EN (used) ===");
  for (const [root, keys] of Object.entries(group(missingEn)).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n[${root}] ${keys.length}`);
    for (const k of keys.slice(0, 30)) console.log(" ", k);
    if (keys.length > 30) console.log(`  ... +${keys.length - 30} more`);
  }
}

if (enSameAsFr.length) {
  console.log("\n=== EN IDENTICAL TO FR (used) ===");
  for (const [root, keys] of Object.entries(group(enSameAsFr)).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n[${root}] ${keys.length}`);
    for (const k of keys.slice(0, 20)) console.log(" ", k, "=>", enFlat[k]?.slice(0, 60));
    if (keys.length > 20) console.log(`  ... +${keys.length - 20} more`);
  }
}

if (frOnlyKeys.length) {
  console.log("\n=== FR KEYS NOT IN EN CATALOG (sample) ===");
  for (const k of frOnlyKeys.slice(0, 40)) console.log(" ", k);
  if (frOnlyKeys.length > 40) console.log(`  ... +${frOnlyKeys.length - 40} more`);
}

fs.writeFileSync(
  path.join(ROOT, ".tmp-locale-audit.json"),
  JSON.stringify({ missingEn, missingEs, enSameAsFr, enUnresolved, esUnresolved, frOnlyKeys }, null, 2),
);
