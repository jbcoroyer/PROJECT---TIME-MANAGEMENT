"use client";

import { useMemo, useState } from "react";
import { addDays, addWeeks, format, isSameDay, parse, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";

export type ExistingSlot = { date: string; hours: number; title: string };
export type PlanningSlot = { date: string; hours: number; startTime?: string; endTime?: string };

type Props = {
  estimatedHours: number;
  slots: PlanningSlot[];
  existingSlots: ExistingSlot[];
  onChange: (slots: PlanningSlot[]) => void;
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function defaultSlotHours(remaining: number, estimatedHours: number): number {
  const cap = estimatedHours > 0 ? estimatedHours : 3;
  const rem = remaining > 0 ? remaining : cap;
  return Math.max(0.5, Math.min(rem, cap, 2));
}

function sumSlotHours(slots: PlanningSlot[]): number {
  return slots.reduce((acc, slot) => acc + (Number(slot.hours) || 0), 0);
}

export default function NewTaskPlanningCalendar({
  estimatedHours,
  slots,
  existingSlots,
  onChange,
}: Props) {
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());

  const weekStart = useMemo(
    () => startOfWeek(weekAnchor, { weekStartsOn: 1 }),
    [weekAnchor],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const placedHours = useMemo(() => sumSlotHours(slots), [slots]);
  const remaining =
    estimatedHours > 0 ? Math.max(0, estimatedHours - placedHours) : 0;

  const existingByDate = useMemo(() => {
    const map = new Map<string, ExistingSlot[]>();
    for (const slot of existingSlots) {
      if (!slot.date) continue;
      const dateKey = format(parse(slot.date, "yyyy-MM-dd", new Date()), "yyyy-MM-dd");
      const list = map.get(dateKey) ?? [];
      list.push(slot);
      map.set(dateKey, list);
    }
    return map;
  }, [existingSlots]);

  const slotsWithIndex = useMemo(
    () => slots.map((slot, index) => ({ slot, index })),
    [slots],
  );

  const weekLabel = `${format(weekStart, "d MMM")} – ${format(addDays(weekStart, 6), "d MMM yyyy")}`;

  const updateSlotHours = (index: number, delta: number) => {
    const next = slots.map((slot, i) => {
      if (i !== index) return slot;
      const current = Number(slot.hours) || 0;
      const updated = Math.max(0.5, Math.round((current + delta) * 2) / 2);
      return { ...slot, hours: updated };
    });
    onChange(next);
  };

  const removeSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  const addSlotForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    const hours = defaultSlotHours(remaining, estimatedHours);
    onChange([...slots, { date: dateKey, hours }]);
  };

  return (
    <div className="flex max-h-[280px] flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {estimatedHours > 0 ? (
          <p className="text-xs font-medium text-[var(--foreground)]">
            À placer :{" "}
            <span className={remaining > 0 ? "text-[var(--accent)]" : "text-[color:var(--foreground)]/70"}>
              {remaining % 1 === 0 ? remaining : remaining.toFixed(1)} h
            </span>
            {" / "}
            {estimatedHours % 1 === 0 ? estimatedHours : estimatedHours.toFixed(1)} h
          </p>
        ) : (
          <p className="text-xs font-medium text-[color:var(--foreground)]/70">Planification libre</p>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekAnchor((prev) => addWeeks(prev, -1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 transition hover:bg-[var(--surface-soft)]"
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9rem] text-center text-[11px] font-medium capitalize text-[color:var(--foreground)]/75">
            {weekLabel}
          </span>
          <button
            type="button"
            onClick={() => setWeekAnchor((prev) => addWeeks(prev, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 transition hover:bg-[var(--surface-soft)]"
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-[11px] leading-snug text-[var(--ink-muted)]">
        Placez votre charge sur le calendrier. Les blocs gris sont déjà planifiés ailleurs.
      </p>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-soft)]">
        <div className="grid grid-cols-7 border-b border-[var(--line)]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-0.5 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid max-h-[200px] grid-cols-7 divide-x divide-[var(--line)] overflow-y-auto">
          {weekDays.map((day) => {
            const dateKey = formatDateKey(day);
            const dayExisting = existingByDate.get(dateKey) ?? [];
            const daySlots = slotsWithIndex.filter(({ slot }) => slot.date === dateKey);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dateKey}
                className={[
                  "flex min-h-[88px] flex-col gap-0.5 bg-[var(--surface)] p-0.5",
                  isToday ? "ring-1 ring-inset ring-[color:var(--accent)]/35" : "",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => addSlotForDate(day)}
                  className="group flex items-center justify-between rounded px-0.5 py-0.5 text-left transition hover:bg-[var(--surface-soft)]"
                  title="Ajouter un bloc"
                >
                  <span
                    className={[
                      "text-[10px] font-semibold leading-none",
                      isToday ? "text-[var(--accent)]" : "text-[color:var(--foreground)]/80",
                    ].join(" ")}
                  >
                    {format(day, "d")}
                  </span>
                  <Plus className="h-3 w-3 shrink-0 text-[color:var(--foreground)]/35 opacity-0 transition group-hover:opacity-100" />
                </button>

                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                  {dayExisting.map((existing, i) => (
                    <div
                      key={`${dateKey}-existing-${i}`}
                      className="flex items-center gap-0.5 rounded border border-[var(--line)]/70 bg-[var(--surface-soft)] px-1 py-0.5"
                      title={existing.title}
                    >
                      <span className="min-w-0 flex-1 truncate text-[9px] leading-tight text-[var(--ink-muted)]">
                        {existing.title}
                      </span>
                      <span className="shrink-0 text-[9px] font-medium tabular-nums text-[var(--ink-muted)]">
                        {existing.hours % 1 === 0 ? existing.hours : existing.hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}

                  {daySlots.map(({ slot, index }) => (
                    <div
                      key={`${dateKey}-slot-${index}`}
                      className="flex items-center gap-0.5 rounded border border-[color:var(--accent)]/30 bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] px-0.5 py-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => updateSlotHours(index, -0.5)}
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_18%,var(--surface))]"
                        aria-label="Diminuer de 0,5 h"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="min-w-[1.4rem] text-center text-[9px] font-semibold tabular-nums text-[var(--accent)]">
                        {slot.hours % 1 === 0 ? slot.hours : slot.hours.toFixed(1)}h
                      </span>
                      <button
                        type="button"
                        onClick={() => updateSlotHours(index, 0.5)}
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_18%,var(--surface))]"
                        aria-label="Augmenter de 0,5 h"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="ml-auto inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[color:var(--foreground)]/45 hover:bg-[var(--surface-soft)] hover:text-[var(--accent)]"
                        aria-label="Retirer le bloc"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}

                  {dayExisting.length === 0 && daySlots.length === 0 && (
                    <button
                      type="button"
                      onClick={() => addSlotForDate(day)}
                      className="mt-auto flex h-5 w-full items-center justify-center rounded border border-dashed border-[var(--line)] text-[color:var(--foreground)]/30 transition hover:border-[color:var(--accent)]/40 hover:text-[var(--accent)]"
                      aria-label="Ajouter un bloc"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
