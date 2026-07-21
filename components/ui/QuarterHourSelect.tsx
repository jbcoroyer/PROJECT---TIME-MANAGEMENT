"use client";

import { useMemo } from "react";
import { Clock3 } from "lucide-react";
import {
  QUARTER_HOUR_OPTIONS,
  snapTimeToQuarter,
  timeToMinutes,
} from "../../lib/dateTime/quarterHourUtils";

export type QuarterHourSelectProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  /** Heure minimale incluse (HH:mm). */
  min?: string;
  /** Heure maximale incluse (HH:mm). */
  max?: string;
  className?: string;
};

export function QuarterHourSelect({
  value,
  onChange,
  id,
  disabled,
  min,
  max,
  className = "",
}: QuarterHourSelectProps) {
  const snapped = snapTimeToQuarter(value || "09:00");

  const options = useMemo(() => {
    const minM = min ? timeToMinutes(min) : 0;
    const maxM = max ? timeToMinutes(max) : 24 * 60 - 15;
    return QUARTER_HOUR_OPTIONS.filter((t) => {
      const m = timeToMinutes(t);
      return m >= minM && m <= maxM;
    });
  }, [min, max]);

  return (
    <div className={["space-y-2", className].join(" ")}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        <Clock3 className="h-3.5 w-3.5" />
        <span id={id}>{snapped}</span>
      </div>
      <div className="max-h-[9.5rem] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-2">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-6">
          {options.map((time) => {
            const active = snapped === time;
            return (
              <button
                key={time}
                type="button"
                disabled={disabled}
                onClick={() => onChange(time)}
                className={[
                  "rounded-lg border px-1 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm"
                    : "border-transparent bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)]",
                  disabled ? "cursor-not-allowed opacity-55" : "",
                ].join(" ")}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
