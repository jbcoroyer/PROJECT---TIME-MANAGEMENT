"use client";

import type { ReferenceRecord } from "../../../../lib/referenceData";
import { columnVisualForLabel } from "../../../../lib/v2/columnVisuals";
import { useColumnVisuals } from "../../../../lib/useColumnVisuals";

type ColumnStatusBadgeProps = {
  label: string;
  records?: ReferenceRecord[];
  className?: string;
  showDot?: boolean;
};

export default function ColumnStatusBadge({
  label,
  records,
  className = "",
  showDot = true,
}: ColumnStatusBadgeProps) {
  const hook = useColumnVisuals();
  const source = records ?? hook.records;
  const visual = columnVisualForLabel(label, source);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        className,
      ].join(" ")}
      style={{
        backgroundColor: visual.softBg,
        borderColor: visual.borderColor,
        color: visual.textColor,
      }}
    >
      {showDot ? (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: visual.color }}
          aria-hidden
        />
      ) : null}
      {label}
    </span>
  );
}
