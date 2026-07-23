import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");

/** Fichiers d'interface / config marque — hors module métier Workspace. */
const SCAN_ROOTS = [
  "app",
  "components",
  "lib/i18n/messages",
  "lib/branding.ts",
  "lib/legal",
  "lib/server/email.ts",
  "lib/agenda/appointmentRequestEmail.ts",
  "lib/config/legal.ts",
  "scripts/setup-stripe-annual-price.ts",
] as const;

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".env.example"]);

/** Ancienne marque produit — ne doit plus apparaître en dur. */
const FORBIDDEN_ALWAYS: Array<{ label: string; pattern: RegExp }> = [
  { label: "WorkSpace", pattern: /WorkSpace/ },
  { label: "Workspace Solutions", pattern: /Workspace Solutions/ },
  { label: "workspace-demo.fr", pattern: /workspace-demo\.fr/ },
  { label: "Camille Dupont", pattern: /Camille Dupont/ },
];

/**
 * Défaut produit historique en chaîne littérale.
 * Non appliqué aux fichiers i18n : l'anglais utilise encore "Workspace" comme nom commun (ambigu, intact).
 */
const FORBIDDEN_PRODUCT_LITERAL = {
  label: 'littéral "Workspace"',
  pattern: /(["'`])Workspace\1/,
};

function patternsForFile(relPath: string): Array<{ label: string; pattern: RegExp }> {
  const normalized = relPath.replace(/\\/g, "/");
  if (normalized.startsWith("lib/i18n/messages/")) {
    return FORBIDDEN_ALWAYS;
  }
  return [...FORBIDDEN_ALWAYS, FORBIDDEN_PRODUCT_LITERAL];
}

function shouldSkip(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, "/");
  if (normalized.includes("node_modules")) return true;
  if (normalized.endsWith(".test.ts") || normalized.endsWith(".test.tsx")) return true;
  if (normalized.includes("lib/config/brandHardcode")) return true;
  return false;
}

function collectFiles(absPath: string, out: string[]): void {
  const st = statSync(absPath);
  if (st.isFile()) {
    out.push(absPath);
    return;
  }
  if (!st.isDirectory()) return;
  for (const entry of readdirSync(absPath)) {
    if (entry === "node_modules" || entry === ".git" || entry === ".next") continue;
    collectFiles(join(absPath, entry), out);
  }
}

function listInterfaceFiles(): string[] {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root);
    try {
      collectFiles(abs, files);
    } catch {
      // chemin optionnel
    }
  }
  return files.filter((abs) => {
    const rel = relative(ROOT, abs);
    if (shouldSkip(rel)) return false;
    const lower = abs.toLowerCase();
    return [...EXTENSIONS].some((ext) => lower.endsWith(ext));
  });
}

describe("garde-fou marque produit", () => {
  it("n'autorise aucune occurrence en dur de l'ancienne marque dans les fichiers d'interface", () => {
    const hits: string[] = [];

    for (const file of listInterfaceFiles()) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      const content = readFileSync(file, "utf8");
      for (const { label, pattern } of patternsForFile(rel)) {
        if (pattern.test(content)) {
          hits.push(`${rel} → ${label}`);
        }
      }
    }

    expect(hits, `Occurrences interdites:\n${hits.join("\n")}`).toEqual([]);
  });
});
