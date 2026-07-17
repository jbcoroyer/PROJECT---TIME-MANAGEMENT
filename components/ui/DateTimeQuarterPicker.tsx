"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import {
  buildDateTimeLocal,
  HOUR_OPTIONS,
  parseDateTimeLocal,
  QUARTER_MINUTES,
} from "../../lib/dateTime/quarterHourUtils";

type DateTimeQuarterPickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
};

export function DateTimeQuarterPicker({
  value,
  onChange,
  id,
  disabled,
}: DateTimeQuarterPickerProps) {
  const { date, hour, minute } = useMemo(() => parseDateTimeLocal(value), [value]);

  const update = (next: { date?: string; hour?: string; minute?: number }) => {
    onChange(
      buildDateTimeLocal(
        next.date ?? date,
        next.hour ?? hour,
        next.minute ?? minute,
      ),
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          id={id}
          type="date"
          value={date}
          onChange={(e) => update({ date: e.target.value })}
          disabled={disabled}
          className="ui-input pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={hour}
          onChange={(e) => update({ hour: e.target.value })}
          disabled={disabled}
          className="ui-input w-[4.5rem] shrink-0 px-2 text-center"
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
            const active = minute === m;
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => update({ minute: m })}
                className={[
                  "rounded-lg border px-1 py-2 text-xs font-semibold transition-colors",
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
