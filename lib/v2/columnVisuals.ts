import type { ReferenceRecord } from "../referenceData";
import { BOARD_COLUMN_PALETTE } from "./boardColumns";

export type ColumnVisual = {
  color: string;
  softBg: string;
  borderColor: string;
  textColor: string;
};

export function resolveColumnColor(
  label: string,
  records: ReferenceRecord[],
  fallbackIndex = 0,
): string {
  const match = records.find((r) => r.name === label);
  if (match?.color?.trim()) return match.color.trim();
  const idx =
    fallbackIndex ||
    Math.max(
      0,
      records.findIndex((r) => r.name === label),
    );
  return BOARD_COLUMN_PALETTE[(idx >= 0 ? idx : fallbackIndex) % BOARD_COLUMN_PALETTE.length];
}

export function columnVisualForLabel(label: string, records: ReferenceRecord[]): ColumnVisual {
  const index = records.findIndex((r) => r.name === label);
  const color = resolveColumnColor(label, records, index >= 0 ? index : 0);
  return columnVisualFromColor(color);
}

export function columnVisualFromColor(color: string): ColumnVisual {
  return {
    color,
    softBg: `color-mix(in srgb, ${color} 12%, var(--surface-soft))`,
    borderColor: `color-mix(in srgb, ${color} 32%, var(--line))`,
    textColor: `color-mix(in srgb, ${color} 72%, var(--foreground))`,
  };
}

export function isDoneColumnLabel(label: string, records: ReferenceRecord[]): boolean {
  if (label === "Terminé") return true;
  const match = records.find((r) => r.name === label);
  return Boolean(match?.isDone);
}
