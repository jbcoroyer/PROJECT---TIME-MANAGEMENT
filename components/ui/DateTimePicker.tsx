"use client";

import { useMemo } from "react";
import {
  buildDateTimeLocal,
  parseDateTimeLocal,
} from "../../lib/dateTime/quarterHourUtils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

export type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  compact?: boolean;
  className?: string;
};

export function DateTimePicker({
  value,
  onChange,
  id,
  disabled,
  min,
  max,
  compact,
  className = "",
}: DateTimePickerProps) {
  const { date, hour, minute } = useMemo(() => parseDateTimeLocal(value), [value]);
  const timeValue = `${hour}:${String(minute).padStart(2, "0")}`;

  const minDate = min?.slice(0, 10);
  const maxDate = max?.slice(0, 10);

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
    <div className={["space-y-2", className].join(" ")}>
      <DatePicker
        id={id ? `${id}-date` : undefined}
        value={date}
        onChange={(d) => update({ date: d })}
        disabled={disabled}
        min={minDate}
        max={maxDate}
        compact={compact}
        clearable={false}
      />
      <TimePicker
        id={id ? `${id}-time` : undefined}
        value={timeValue}
        onChange={(t) => {
          const [h, m] = t.split(":");
          update({ hour: h, minute: Number(m) });
        }}
        disabled={disabled}
        compact={compact}
      />
    </div>
  );
}

/** @deprecated Use DateTimePicker — kept for backward compatibility */
export function DateTimeQuarterPicker(props: DateTimePickerProps) {
  return <DateTimePicker {...props} />;
}
