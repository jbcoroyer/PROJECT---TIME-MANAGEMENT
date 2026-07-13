import type { AppModuleId } from "./types";

export type ModuleGlyphColor = "orange" | "teal" | "violet" | "yellow" | "pink" | "blue";

export type ModuleGlyphShape =
  | "kanban-grid"
  | "check-circle"
  | "calendar"
  | "bulb"
  | "plane"
  | "flag"
  | "megaphone"
  | "tape-box"
  | "target"
  | "image-stack"
  | "document";

export type ModuleGlyphMeta = {
  color: ModuleGlyphColor;
  shape: ModuleGlyphShape;
  label: string;
};

/**
 * Table de correspondance module → couleur / glyphe (handoff Recueil).
 *
 * | Module            | Forme              | Teinte   |
 * |-------------------|--------------------|----------|
 * | dashboard         | colonnes kanban    | orange   |
 * | workspace         | cercle à coche     | teal     |
 * | planning          | calendrier         | violet   |
 * | ideas             | ampoule            | jaune    |
 * | asks              | avion              | teal     |
 * | events            | drapeau            | violet   |
 * | social            | mégaphone          | rose     |
 * | dam               | images empilées    | bleu     |
 * | stock             | boîte scotchée     | orange   |
 * | okr               | cible              | teal     |
 * | surveys           | document           | violet   |
 */
export const MODULE_GLYPH_META: Record<AppModuleId, ModuleGlyphMeta> = {
  dashboard: { color: "orange", shape: "kanban-grid", label: "Tableau de bord" },
  workspace: { color: "teal", shape: "check-circle", label: "Mon agenda" },
  planning: { color: "violet", shape: "calendar", label: "Planning" },
  ideas: { color: "yellow", shape: "bulb", label: "Boîte à idées" },
  asks: { color: "teal", shape: "plane", label: "Boîte à demandes" },
  events: { color: "violet", shape: "flag", label: "Événements" },
  social: { color: "pink", shape: "megaphone", label: "Réseaux sociaux" },
  dam: { color: "blue", shape: "image-stack", label: "Fichiers & visuels" },
  stock: { color: "orange", shape: "tape-box", label: "Stock" },
  okr: { color: "teal", shape: "target", label: "Objectifs d'équipe" },
  surveys: { color: "violet", shape: "document", label: "Enquêtes" },
};

/** Ordre d'affichage landing (11 modules + IA). */
export const LANDING_MODULE_ORDER: AppModuleId[] = [
  "dashboard",
  "workspace",
  "planning",
  "ideas",
  "asks",
  "events",
  "social",
  "dam",
  "stock",
  "okr",
  "surveys",
];

export function getModuleGlyphMeta(moduleId: AppModuleId): ModuleGlyphMeta {
  return MODULE_GLYPH_META[moduleId];
}
