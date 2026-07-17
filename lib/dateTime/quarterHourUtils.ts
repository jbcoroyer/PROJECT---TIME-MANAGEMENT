/** Minutes autorisées (quarts d'heure). */
export const QUARTER_MINUTES = [0, 15, 30, 45] as const;

/** Options HH:mm pour toute la journée, par pas de 15 min. */
export const QUARTER_HOUR_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

/** Arrondit une date au quart d'heure le plus proche. */
export function snapToQuarterHour(date: Date): Date {
  const result = new Date(date);
  const totalMinutes = result.getHours() * 60 + result.getMinutes();
  const snapped = Math.round(totalMinutes / 15) * 15;
  const hours = Math.floor(snapped / 60) % 24;
  const minutes = snapped % 60;
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/** Arrondit une heure HH:mm au quart d'heure le plus proche. */
export function snapTimeToQuarter(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = (h ?? 0) * 60 + (m ?? 0);
  const snapped = Math.round(totalMinutes / 15) * 15;
  const hours = Math.floor(snapped / 60) % 24;
  const minutes = snapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseDateTimeLocal(value: string): { date: string; hour: string; minute: number } {
  const [datePart, timePart] = value.split("T");
  const snapped = snapTimeToQuarter(timePart?.slice(0, 5) ?? "09:00");
  const [hour, minuteStr] = snapped.split(":");
  return {
    date: datePart ?? "",
    hour: hour ?? "09",
    minute: Number(minuteStr) || 0,
  };
}

export function buildDateTimeLocal(date: string, hour: string, minute: number): string {
  const m = QUARTER_MINUTES.includes(minute as (typeof QUARTER_MINUTES)[number])
    ? minute
    : QUARTER_MINUTES.reduce((prev, curr) =>
        Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev,
      );
  return `${date}T${hour}:${String(m).padStart(2, "0")}`;
}

export function toLocalDateTimeValue(date: Date): string {
  const snapped = snapToQuarterHour(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${snapped.getFullYear()}-${pad(snapped.getMonth() + 1)}-${pad(snapped.getDate())}T${pad(snapped.getHours())}:${pad(snapped.getMinutes())}`;
}
