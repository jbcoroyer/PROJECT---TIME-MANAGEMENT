"use client";

import { useMemo } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Locale } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatIsoDate, isIsoDateInRange } from "../../lib/dateTime/datePickerUtils";

type CalendarGridProps = {
  viewMonth: Date;
  onViewMonthChange: (month: Date) => void;
  selected?: string;
  onSelect: (isoDate: string) => void;
  min?: string;
  max?: string;
  locale: Locale;
  labels: {
    prevMonth: string;
    nextMonth: string;
    today: string;
    clear: string;
  };
  showFooter?: boolean;
  onClear?: () => void;
};

export function CalendarGrid({
  viewMonth,
  onViewMonthChange,
  selected,
  onSelect,
  min,
  max,
  locale,
  labels,
  showFooter = true,
  onClear,
}: CalendarGridProps) {
  const weekStartsOn = 1 as const;

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn, locale });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn, locale });

    const days: Date[] = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [viewMonth, locale]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn, locale });
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(start, i), "EEEEE", { locale }),
    );
  }, [locale]);

  const selectDay = (day: Date) => {
    const iso = formatIsoDate(day);
    if (!isIsoDateInRange(iso, min, max)) return;
    onSelect(iso);
  };

  const goToday = () => {
    const today = new Date();
    onViewMonthChange(startOfMonth(today));
    selectDay(today);
  };

  return (
    <div className="w-[17.5rem]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewMonthChange(addMonths(viewMonth, -1))}
          className="ui-btn ui-btn-ghost flex h-8 w-8 items-center justify-center p-0"
          aria-label={labels.prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold capitalize text-[var(--foreground)]">
          {format(viewMonth, "LLLL yyyy", { locale })}
        </p>
        <button
          type="button"
          onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
          className="ui-btn ui-btn-ghost flex h-8 w-8 items-center justify-center p-0"
          aria-label={labels.nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div role="grid" aria-label={format(viewMonth, "LLLL yyyy", { locale })} className="select-none">
        <div role="row" className="mb-1 grid grid-cols-7 gap-0.5">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              role="columnheader"
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
            >
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7 gap-0.5">
            {week.map((day) => {
              const iso = formatIsoDate(day);
              const inMonth = isSameMonth(day, viewMonth);
              const isSelected = selected === iso;
              const disabled = !isIsoDateInRange(iso, min, max);
              const today = isToday(day);

              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  aria-selected={isSelected}
                  aria-current={today ? "date" : undefined}
                  className={[
                    "flex h-9 w-full items-center justify-center rounded-xl text-sm font-medium transition-colors",
                    !inMonth ? "text-[var(--ink-muted)]/45" : "text-[var(--foreground)]",
                    isSelected
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm"
                      : today
                        ? "ring-1 ring-[var(--accent)]/35 bg-[var(--accent-soft)]"
                        : "hover:bg-[var(--surface-soft)]",
                    disabled ? "cursor-not-allowed opacity-35 hover:bg-transparent" : "",
                  ].join(" ")}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {showFooter ? (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
          <button
            type="button"
            onClick={goToday}
            className="ui-btn ui-btn-ghost px-2 py-1 text-xs font-semibold"
          >
            {labels.today}
          </button>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="ui-btn ui-btn-ghost px-2 py-1 text-xs font-semibold text-[var(--ink-muted)]"
            >
              {labels.clear}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function isoToDisplayDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return format(new Date(y, m - 1, d), "d MMM yyyy", { locale });
}
