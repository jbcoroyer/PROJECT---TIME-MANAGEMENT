import { addDays, addMinutes, getDay, isBefore, isSameDay, startOfDay } from "date-fns";
import { getIntlLocale } from "../i18n/dateFnsLocale";
import type { AppLocale } from "../i18n/index";
import type { BookingSlot, WorkDayConfig, WorkHours, WeekdayKey } from "./agendaTypes";
import { WEEKDAY_KEYS } from "./agendaTypes";

export const DEFAULT_WORK_HOURS: WorkHours = {
  mon: { enabled: true, start: "09:00", end: "17:00", breakStart: "12:30", breakEnd: "14:00" },
  tue: { enabled: true, start: "09:00", end: "17:00", breakStart: "12:30", breakEnd: "14:00" },
  wed: { enabled: true, start: "09:00", end: "17:00", breakStart: "12:30", breakEnd: "14:00" },
  thu: { enabled: true, start: "09:00", end: "17:00", breakStart: "12:30", breakEnd: "14:00" },
  fri: { enabled: true, start: "09:00", end: "17:00", breakStart: "12:30", breakEnd: "14:00" },
  sat: { enabled: false, start: "09:00", end: "12:00" },
  sun: { enabled: false, start: "09:00", end: "12:00" },
};

function weekdayKey(date: Date): WeekdayKey {
  return WEEKDAY_KEYS[getDay(date)] ?? "mon";
}

function parseTimeOnDate(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h ?? 0, m ?? 0, 0, 0);
  return result;
}

function normalizeWorkHours(raw: unknown): WorkHours {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_WORK_HOURS };
  const input = raw as Partial<WorkHours>;
  const out = { ...DEFAULT_WORK_HOURS };
  for (const key of Object.keys(DEFAULT_WORK_HOURS) as WeekdayKey[]) {
    const day = input[key];
    if (day && typeof day === "object") {
      out[key] = {
        enabled: Boolean(day.enabled),
        start: typeof day.start === "string" ? day.start : out[key].start,
        end: typeof day.end === "string" ? day.end : out[key].end,
        breakStart:
          typeof day.breakStart === "string"
            ? day.breakStart
            : (out[key].breakStart ?? null),
        breakEnd:
          typeof day.breakEnd === "string" ? day.breakEnd : (out[key].breakEnd ?? null),
      };
    }
  }
  return out;
}

export { normalizeWorkHours };

type BusyInterval = { start: Date; end: Date };

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function expandWithBuffer(interval: BusyInterval, bufferMinutes: number): BusyInterval {
  return {
    start: addMinutes(interval.start, -bufferMinutes),
    end: addMinutes(interval.end, bufferMinutes),
  };
}

function collectSlotsInRange(
  rangeStart: Date,
  rangeEnd: Date,
  busyIntervals: BusyInterval[],
  slotDurationMinutes: number,
  bufferMinutes: number,
  minStart: Date,
): BookingSlot[] {
  if (!isBefore(rangeStart, rangeEnd)) return [];

  const slots: BookingSlot[] = [];
  let cursor = rangeStart;

  while (addMinutes(cursor, slotDurationMinutes) <= rangeEnd) {
    const slotEnd = addMinutes(cursor, slotDurationMinutes);
    const blocked = busyIntervals.some((busy) => {
      const expanded = expandWithBuffer(busy, bufferMinutes);
      return overlaps(cursor, slotEnd, expanded.start, expanded.end);
    });

    if (!blocked && !isBefore(slotEnd, minStart)) {
      slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
    }

    cursor = addMinutes(cursor, slotDurationMinutes + bufferMinutes);
  }

  return slots;
}

/** Créneaux disponibles pour une date donnée. */
export function getAvailableSlotsForDate(
  date: Date,
  workHours: WorkHours,
  busyIntervals: BusyInterval[],
  slotDurationMinutes: number,
  bufferMinutes: number,
  minNoticeHours: number,
  now: Date,
): BookingSlot[] {
  const dayKey = weekdayKey(date);
  const dayConfig: WorkDayConfig = workHours[dayKey] ?? DEFAULT_WORK_HOURS[dayKey];
  if (!dayConfig.enabled) return [];

  const minStart = addMinutes(now, minNoticeHours * 60);

  const hasBreak =
    dayConfig.breakStart &&
    dayConfig.breakEnd &&
    dayConfig.breakStart < dayConfig.breakEnd;

  if (hasBreak) {
    const morningStart = parseTimeOnDate(date, dayConfig.start);
    const morningEnd = parseTimeOnDate(date, dayConfig.breakStart!);
    const afternoonStart = parseTimeOnDate(date, dayConfig.breakEnd!);
    const afternoonEnd = parseTimeOnDate(date, dayConfig.end);

    return [
      ...collectSlotsInRange(
        morningStart,
        morningEnd,
        busyIntervals,
        slotDurationMinutes,
        bufferMinutes,
        minStart,
      ),
      ...collectSlotsInRange(
        afternoonStart,
        afternoonEnd,
        busyIntervals,
        slotDurationMinutes,
        bufferMinutes,
        minStart,
      ),
    ];
  }

  const dayStart = parseTimeOnDate(date, dayConfig.start);
  const dayEnd = parseTimeOnDate(date, dayConfig.end);
  return collectSlotsInRange(
    dayStart,
    dayEnd,
    busyIntervals,
    slotDurationMinutes,
    bufferMinutes,
    minStart,
  );
}

/** Dates bookables dans l'horizon (jours ouvrés activés). */
export function getBookableDates(
  from: Date,
  horizonDays: number,
  workHours: WorkHours,
): Date[] {
  const dates: Date[] = [];
  const start = startOfDay(from);
  for (let i = 0; i < horizonDays; i += 1) {
    const date = addDays(start, i);
    const key = weekdayKey(date);
    if (workHours[key]?.enabled) dates.push(date);
  }
  return dates;
}

export function isDateBookable(date: Date, workHours: WorkHours): boolean {
  return Boolean(workHours[weekdayKey(date)]?.enabled);
}

export function slotsForDayLabel(date: Date, locale: AppLocale, todayLabel: string): string {
  const intlLocale = getIntlLocale(locale);
  return isSameDay(date, new Date())
    ? todayLabel
    : date.toLocaleDateString(intlLocale, { weekday: "long", day: "numeric", month: "long" });
}
