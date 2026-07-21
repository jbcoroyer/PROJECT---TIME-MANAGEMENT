#!/usr/bin/env npx tsx
/**
 * Vérifie que chaque colonne lue dans APP_SETTINGS_COLUMNS est déclarée
 * dans au moins une migration Supabase (add column / create table app_settings).
 *
 * Usage : npm run audit:app-settings
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { APP_SETTINGS_COLUMNS } from "../lib/appSettings/columns";

const migrationsDir = join(process.cwd(), "supabase", "migrations");

function loadMigrationSql(): string {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => readFileSync(join(migrationsDir, name), "utf8"))
    .join("\n");
}

function columnDeclaredInMigrations(column: string, sql: string): boolean {
  if (column === "id" || column === "organization_id" || column === "updated_at") {
    return /create table if not exists public\.app_settings/i.test(sql);
  }
  const patterns = [
    new RegExp(`\\b${column}\\b`, "i"),
    new RegExp(`add column if not exists\\s+${column}\\b`, "i"),
    new RegExp(`add column\\s+${column}\\b`, "i"),
  ];
  return patterns.some((p) => p.test(sql));
}

function main() {
  const sql = loadMigrationSql();
  const missing: string[] = [];

  for (const column of APP_SETTINGS_COLUMNS) {
    if (!columnDeclaredInMigrations(column, sql)) {
      missing.push(column);
    }
  }

  if (missing.length > 0) {
    console.error("Audit app_settings — colonnes sans migration détectée :");
    for (const col of missing) {
      console.error(`  - ${col}`);
    }
    console.error(
      "\nAjoutez une migration SQL et mettez à jour lib/appSettings/columns.ts avant déploiement.",
    );
    process.exit(1);
  }

  console.log(
    `Audit app_settings OK — ${APP_SETTINGS_COLUMNS.length} colonnes référencées dans les migrations.`,
  );
}

main();
