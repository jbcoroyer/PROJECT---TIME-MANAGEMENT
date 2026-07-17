"use client";

import { useMemo } from "react";
import { Clock3 } from "lucide-react";
import { HOUR_OPTIONS, QUARTER_MINUTES } from "../../lib/dateTime/quarterHourUtils";

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, m) => String(m).padStart(2, "0"));

export type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  minuteStep?: 1 | 15;
  className?: string;
  compact?: boolean;
};

function parseTime(value: string): { hour: string; minute: string } {
  const [hour = "09", minute = "00"] = (value || "09:00").split(":");
  return { hour: hour.padStart(2, "0"), minute: minute.padStart(2, "0") };
}

export function TimePicker({
  value,
  onChange,
  id,
  disabled,
  minuteStep = 15,
  className = "",
  compact = false,
}: TimePickerProps) {
  const { hour, minute } = useMemo(() => parseTime(value), [value]);

  const update = (nextHour: string, nextMinute: string | number) => {
    const m = String(nextMinute).padStart(2, "0");
    onChange(`${nextHour}:${m}`);
  };

  if (minuteStep === 1) {
    return (
      <div className={["flex items-center gap-2", className].join(" ")}>
        <Clock3 className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
        <select
          id={id}
          value={hour}
          disabled={disabled}
          onChange={(e) => update(e.target.value, minute)}
          className={[
            "ui-input w-[4.5rem] shrink-0 px-2 text-center",
            compact ? "py-1.5 text-xs" : "",
          ].join(" ")}
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-sm font-semibold text-[var(--ink-muted)]">:</span>
        <select
          value={minute}
          disabled={disabled}
          onChange={(e) => update(hour, e.target.value)}
          className={[
            "ui-input w-[4.5rem] shrink-0 px-2 text-center",
            compact ? "py-1.5 text-xs" : "",
          ].join(" ")}
        >
          {MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const minuteNum = Number(minute);
  const activeMinute = QUARTER_MINUTES.includes(minuteNum as (typeof QUARTER_MINUTES)[number])
    ? minuteNum
    : QUARTER_MINUTES.reduce((prev, curr) =>
        Math.abs(curr - minuteNum) < Math.abs(prev - minuteNum) ? curr : prev,
      );

  return (
    <div className={["space-y-2", className].join(" ")}>
      <div className="flex items-center gap-2">
        <select
          id={id}
          value={hour}
          onChange={(e) => update(e.target.value, activeMinute)}
          disabled={disabled}
          className={[
            "ui-input w-[4.5rem] shrink-0 px-2 text-center",
            compact ? "py-1.5 text-xs" : "",
          ].join(" ")}
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-sm font-semibold text-[var(--ink-muted)]">:</span>
        <div className="grid flex-1 grid-cols-4 gap-1">
          {QUARTER_MINUTES.map((m) => {
            const active = activeMinute === m;
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => update(hour, m)}
                className={[
                  "rounded-lg border px-1 py-2 text-xs font-semibold transition-colors",
                  compact ? "py-1.5" : "",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink-muted)] hover:border-[var(--accent)]",
                  disabled ? "cursor-not-allowed opacity-55" : "",
                ].join(" ")}
              >
                {String(m).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
