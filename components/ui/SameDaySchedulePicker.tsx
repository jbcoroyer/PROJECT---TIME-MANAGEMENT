"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { DatePicker } from "./DatePicker";
import { QuarterHourSelect } from "./QuarterHourSelect";
import {
  addQuarterHours,
  buildDateTimeLocal,
  parseDateTimeLocal,
  snapTimeToQuarter,
  timeToMinutes,
} from "../../lib/dateTime/quarterHourUtils";
import { getDateFnsLocale } from "../../lib/i18n/dateFnsLocale";
import { useTranslation } from "../../lib/i18n/useTranslation";

export type SameDaySchedulePickerProps = {
  startsAt: string;
  endsAt: string;
  onChange: (next: { startsAt: string; endsAt: string }) => void;
  disabled?: boolean;
};

export function SameDaySchedulePicker({
  startsAt,
  endsAt,
  onChange,
  disabled,
}: SameDaySchedulePickerProps) {
  const { t, locale } = useTranslation();
  const dateLocale = useMemo(() => getDateFnsLocale(locale), [locale]);

  const startParts = useMemo(() => parseDateTimeLocal(startsAt), [startsAt]);
  const endParts = useMemo(() => parseDateTimeLocal(endsAt), [endsAt]);

  const startTime = `${startParts.hour}:${String(startParts.minute).padStart(2, "0")}`;
  const endTime = `${endParts.hour}:${String(endParts.minute).padStart(2, "0")}`;
  const date = startParts.date || endParts.date;

  const durationMinutes = Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime));
  const endMin = addQuarterHours(startTime, 1);

  const updateSchedule = (next: {
    date?: string;
    startTime?: string;
    endTime?: string;
  }) => {
    const nextDate = next.date ?? date;
    const nextStart = snapTimeToQuarter(next.startTime ?? startTime);
    let nextEnd = snapTimeToQuarter(next.endTime ?? endTime);

    if (timeToMinutes(nextEnd) <= timeToMinutes(nextStart)) {
      nextEnd = addQuarterHours(nextStart, 2);
    }

    onChange({
      startsAt: buildDateTimeLocal(
        nextDate,
        nextStart.split(":")[0]!,
        Number(nextStart.split(":")[1]),
      ),
      endsAt: buildDateTimeLocal(nextDate, nextEnd.split(":")[0]!, Number(nextEnd.split(":")[1])),
    });
  };

  const durationLabel =
    durationMinutes >= 60
      ? durationMinutes % 60 === 0
        ? t("agenda.form.durationHoursOnly", { hours: Math.floor(durationMinutes / 60) })
        : t("agenda.form.durationHours", {
            hours: Math.floor(durationMinutes / 60),
            minutes: durationMinutes % 60,
          })
      : t("agenda.form.durationMinutes", { minutes: durationMinutes });

  return (
    <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
        {t("agenda.form.dateLabel")}
        <DatePicker
          value={date}
          onChange={(d) => updateSchedule({ date: d })}
          disabled={disabled}
          clearable={false}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
          {t("agenda.form.startTimeLabel")}
          <QuarterHourSelect
            value={startTime}
            onChange={(time) => updateSchedule({ startTime: time })}
            disabled={disabled}
            max="23:30"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
          {t("agenda.form.endTimeLabel")}
          <QuarterHourSelect
            value={endTime}
            onChange={(time) => updateSchedule({ endTime: time })}
            disabled={disabled}
            min={endMin}
            max="23:45"
          />
        </label>
      </div>

      <p className="text-center text-[11px] text-[var(--ink-muted)]">
        {date ? format(parseISO(date), "EEEE d MMMM yyyy", { locale: dateLocale }) : null}
        {durationMinutes > 0 ? ` · ${durationLabel}` : null}
      </p>
    </div>
  );
}
