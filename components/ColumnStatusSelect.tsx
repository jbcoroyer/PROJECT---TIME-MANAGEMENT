"use client";

import type { ColumnId } from "../lib/types";
import type { ReferenceRecord } from "../lib/referenceData";
import { columnVisualForLabel } from "../lib/v2/columnVisuals";
import { useColumnVisuals } from "../lib/useColumnVisuals";

type ColumnStatusSelectProps = {
  value: ColumnId;
  columns: ColumnId[];
  records?: ReferenceRecord[];
  onChange: (next: ColumnId) => void;
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
};

export default function ColumnStatusSelect({
  value,
  columns,
  records,
  onChange,
  className = "",
  size = "md",
  "aria-label": ariaLabel = "Statut",
}: ColumnStatusSelectProps) {
  const hook = useColumnVisuals();
  const source = records ?? hook.records;
  const visual = columnVisualForLabel(value, source);
  const sizeClass = size === "sm" ? "px-2 py-1 text-[11px]" : "px-2 py-1.5 text-xs";

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ColumnId)}
      aria-label={ariaLabel}
      className={[
        "w-full cursor-pointer rounded-lg border font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30",
        sizeClass,
        className,
      ].join(" ")}
      style={{
        backgroundColor: visual.softBg,
        borderColor: visual.borderColor,
        color: visual.textColor,
      }}
    >
      {columns.map((col) => (
        <option key={col} value={col}>
          {col}
        </option>
      ))}
    </select>
  );
}
