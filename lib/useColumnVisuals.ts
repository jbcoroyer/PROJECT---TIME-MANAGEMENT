"use client";

import { useMemo } from "react";
import { useReferenceData } from "./useReferenceData";
import {
  columnVisualForLabel,
  columnVisualFromColor,
  isDoneColumnLabel,
  resolveColumnColor,
  type ColumnVisual,
} from "./v2/columnVisuals";

export function useColumnVisuals() {
  const { columns } = useReferenceData();

  return useMemo(
    () => ({
      records: columns,
      colorFor: (label: string) => resolveColumnColor(label, columns),
      visualFor: (label: string): ColumnVisual => columnVisualForLabel(label, columns),
      visualFromColor: columnVisualFromColor,
      isDoneColumn: (label: string) => isDoneColumnLabel(label, columns),
    }),
    [columns],
  );
}
