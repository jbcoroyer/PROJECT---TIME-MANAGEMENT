"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Clock3 } from "lucide-react";
import {
  QUARTER_HOUR_OPTIONS,
  snapTimeToQuarter,
  timeToMinutes,
} from "../../lib/dateTime/quarterHourUtils";
import { usePopoverDismiss } from "./usePopoverDismiss";

export type CompactTimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  "aria-label"?: string;
};

export function CompactTimeSelect({
  value,
  onChange,
  id,
  disabled,
  min,
  max,
  className = "",
  "aria-label": ariaLabel,
}: CompactTimeSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const snapped = snapTimeToQuarter(value || "09:00");

  usePopoverDismiss(open, rootRef, () => setOpen(false));

  const options = useMemo(() => {
    const minM = min ? timeToMinutes(min) : 0;
    const maxM = max ? timeToMinutes(max) : 24 * 60 - 15;
    return QUARTER_HOUR_OPTIONS.filter((t) => {
      const m = timeToMinutes(t);
      return m >= minM && m <= maxM;
    });
  }, [min, max]);

  return (
    <div ref={rootRef} className={["relative", className].join(" ")}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((v) => !v)}
        className={[
          "ui-input flex w-full min-w-[5.5rem] items-center justify-between gap-1.5 px-2.5 py-2 text-sm font-semibold tabular-nums",
          disabled ? "cursor-not-allowed opacity-50" : "",
        ].join(" ")}
      >
        <span className="flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
          {snapped}
        </span>
        <ChevronDown
          className={[
            "h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)] transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 z-50 mt-1 w-[min(100%,14rem)] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[var(--shadow-2)]"
        >
          <div className="max-h-44 overflow-y-auto">
            <div className="grid grid-cols-3 gap-1">
              {options.map((time) => {
                const active = snapped === time;
                return (
                  <button
                    key={time}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(time);
                      setOpen(false);
                    }}
                    className={[
                      "rounded-lg border px-1 py-1.5 text-xs font-semibold tabular-nums transition-colors",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : "border-transparent bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)]",
                    ].join(" ")}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
