import { addDays, addMinutes, getDay, isBefore, isSameDay, startOfDay } from "date-fns";
import { getIntlLocale } from "../i18n/dateFnsLocale";
import type { AppLocale } from "../i18n/index";
import type { BookingSlot, WorkDayConfig, WorkHours, WeekdayKey } from "./agendaTypes";
import { WEEKDAY_KEYS } from "./agendaTypes";

export const DEFAULT_WORK_HOURS: WorkHours = {
  mon: { enabled: true, start: "09:00", end: "18:00" },
  tue: { enabled: true, start: "09:00", end: "18:00" },
  wed: { enabled: true, start: "09:00", end: "18:00" },
  thu: { enabled: true, start: "09:00", end: "18:00" },
  fri: { enabled: true, start: "09:00", end: "17:00" },
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

  const dayStart = parseTimeOnDate(date, dayConfig.start);
  const dayEnd = parseTimeOnDate(date, dayConfig.end);
  if (!isBefore(dayStart, dayEnd)) return [];

  const minStart = addMinutes(now, minNoticeHours * 60);
  const slots: BookingSlot[] = [];
  let cursor = dayStart;

  while (addMinutes(cursor, slotDurationMinutes) <= dayEnd) {
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
