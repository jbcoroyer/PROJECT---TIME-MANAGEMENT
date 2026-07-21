"use client";

import { useMemo } from "react";
import { Copy, CalendarRange } from "lucide-react";
import type { WeekdayKey, WorkDayConfig, WorkHours } from "../../../lib/agenda/agendaTypes";
import { WEEKDAY_KEYS } from "../../../lib/agenda/agendaTypes";
import { addQuarterHours, timeToMinutes } from "../../../lib/dateTime/quarterHourUtils";
import { createDisplayLabelHelpers } from "../../../lib/i18n/displayLabels";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { CompactTimeSelect } from "../../ui/CompactTimeSelect";
import ModuleToggle from "../../modules/ModuleToggle";

const WEEKDAYS: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKEND: WeekdayKey[] = ["sat", "sun"];

type WeeklyAvailabilityEditorProps = {
  value: WorkHours;
  onChange: (next: WorkHours) => void;
  disabled?: boolean;
};

function updateDay(
  hours: WorkHours,
  key: WeekdayKey,
  patch: Partial<WorkDayConfig>,
): WorkHours {
  const day = hours[key];
  let nextDay = { ...day, ...patch };

  if (patch.start !== undefined || patch.end !== undefined) {
    const start = patch.start ?? day.start;
    let end = patch.end ?? day.end;
    if (timeToMinutes(end) <= timeToMinutes(start)) {
      end = addQuarterHours(start, 4);
    }
    nextDay = { ...nextDay, start, end };
  }

  return { ...hours, [key]: nextDay };
}

export default function WeeklyAvailabilityEditor({
  value,
  onChange,
  disabled,
}: WeeklyAvailabilityEditorProps) {
  const { t, locale } = useTranslation();
  const labels = useMemo(() => createDisplayLabelHelpers(locale), [locale]);

  const activeCount = WEEKDAY_KEYS.filter((k) => value[k].enabled).length;

  const enableWeekdays = () => {
    onChange(
      WEEKDAYS.reduce(
        (acc, key) => updateDay(acc, key, { enabled: true }),
        { ...value },
      ),
    );
  };

  const copyMondayToWeek = () => {
    const mon = value.mon;
    onChange(
      WEEKDAYS.reduce(
        (acc, key) =>
          updateDay(acc, key, {
            enabled: mon.enabled,
            start: mon.start,
            end: mon.end,
            breakStart: mon.breakStart,
            breakEnd: mon.breakEnd,
          }),
        { ...value },
      ),
    );
  };

  const renderRow = (key: WeekdayKey) => {
    const day = value[key];
    const endMin = addQuarterHours(day.start, 1);

    return (
      <div
        key={key}
        className={[
          "grid grid-cols-[auto_1fr_auto_1fr] items-center gap-x-2 gap-y-1 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0 sm:grid-cols-[7rem_3rem_1fr_auto_1fr]",
          day.enabled ? "" : "opacity-55",
        ].join(" ")}
      >
        <span className="text-sm font-medium text-[var(--foreground)] sm:col-start-1">
          {labels.agendaWeekday(key)}
        </span>

        <div className="flex justify-end sm:col-start-2">
          <ModuleToggle
            active={day.enabled}
            onChange={(enabled) => onChange(updateDay(value, key, { enabled }))}
            label={labels.agendaWeekday(key)}
          />
        </div>

        {day.enabled ? (
          <>
            <CompactTimeSelect
              value={day.start}
              disabled={disabled}
              onChange={(start) => onChange(updateDay(value, key, { start }))}
              aria-label={t("agenda.booking.settings.fromTime", { day: labels.agendaWeekday(key) })}
              className="sm:col-start-3"
            />
            <span className="text-center text-xs text-[var(--ink-muted)]">→</span>
            <CompactTimeSelect
              value={day.end}
              disabled={disabled}
              min={endMin}
              onChange={(end) => onChange(updateDay(value, key, { end }))}
              aria-label={t("agenda.booking.settings.toTime", { day: labels.agendaWeekday(key) })}
              className="sm:col-start-5"
            />
          </>
        ) : (
          <p className="col-span-3 text-xs font-medium text-[var(--ink-muted)] sm:col-span-4 sm:col-start-3">
            {t("agenda.booking.settings.dayOff")}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-[var(--accent)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {t("agenda.booking.settings.weeklyAvailability")}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              {t("agenda.booking.settings.weeklySummary", { count: activeCount })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={enableWeekdays}
            className="ui-btn ui-btn-secondary py-1.5 text-xs"
          >
            {t("agenda.booking.settings.enableWeekdays")}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={copyMondayToWeek}
            className="ui-btn ui-btn-secondary gap-1.5 py-1.5 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            {t("agenda.booking.settings.copyMonday")}
          </button>
        </div>
      </div>

      <div className="hidden border-b border-[var(--line)] bg-[var(--surface)]/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)] sm:grid sm:grid-cols-[7rem_3rem_1fr_auto_1fr] sm:gap-x-2">
        <span>{t("agenda.booking.settings.dayColumn")}</span>
        <span className="text-center">{t("agenda.booking.settings.openColumn")}</span>
        <span>{t("agenda.booking.settings.fromTimeShort")}</span>
        <span />
        <span>{t("agenda.booking.settings.toTimeShort")}</span>
      </div>

      <div>
        {[...WEEKDAYS, ...WEEKEND].map(renderRow)}
      </div>
      </div>
    </div>
  );
}