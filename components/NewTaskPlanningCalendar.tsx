"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type EventProps,
  type SlotInfo,
} from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import {
  addDays,
  addWeeks,
  format,
  getDay,
  parse,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getDateFnsLocale } from "../lib/i18n/dateFnsLocale";
import { useTranslation } from "../lib/i18n/useTranslation";
import { useIsClient } from "../lib/useIsClient";
import { computeSlotHours } from "../lib/projectedWorkUtils";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

export type ExistingSlot = { date: string; hours: number; title: string };
export type PlanningSlot = { date: string; hours: number; startTime?: string; endTime?: string };

type PlanningCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    kind: "mine" | "existing";
    slotIndex?: number;
    existingTitle?: string;
  };
};

type DragDropCalendarProps = {
  events: PlanningCalendarEvent[];
  date: Date;
  onNavigate: (date: Date) => void;
  onSelectSlot: (info: SlotInfo) => void;
  onEventDrop: (args: EventInteractionArgs<PlanningCalendarEvent>) => void;
  onEventResize: (args: EventInteractionArgs<PlanningCalendarEvent>) => void;
  onRemoveSlot: (index: number) => void;
  localizer: ReturnType<typeof dateFnsLocalizer>;
  messages: Record<string, string>;
};

type Props = {
  estimatedHours: number;
  slots: PlanningSlot[];
  existingSlots: ExistingSlot[];
  onChange: (slots: PlanningSlot[]) => void;
};

const DnDCalendar = withDragAndDrop<PlanningCalendarEvent>(Calendar);

function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatTimeLabel(date: Date): string {
  return format(date, "HH:mm");
}

export function slotFromStartEnd(start: Date, end: Date): PlanningSlot {
  const date = formatDateKey(start);
  const startTime = formatTimeLabel(start);
  const endTime = formatTimeLabel(end);
  const hours = computeSlotHours({ startTime, endTime });
  return { date, startTime, endTime, hours };
}

export function slotFromDateAndHours(
  date: string,
  hours: number,
  startTime = "09:00",
): PlanningSlot {
  const [sh, sm] = startTime.split(":").map(Number);
  const endMinutes = sh * 60 + sm + hours * 60;
  const eh = Math.min(20, Math.floor(endMinutes / 60));
  const em = endMinutes % 60;
  const endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  return { date, hours, startTime, endTime };
}

function slotToRange(slot: PlanningSlot): { start: Date; end: Date } {
  const d = parse(slot.date, "yyyy-MM-dd", new Date());
  if (slot.startTime && slot.endTime) {
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh || 9, sm || 0, 0);
    let end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh || 10, em || 0, 0);
    if (end <= start) {
      end = new Date(start.getTime() + Math.max(0.5, slot.hours || 1) * 60 * 60 * 1000);
    }
    return { start, end };
  }
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
  const end = new Date(start.getTime() + Math.max(0.5, slot.hours || 1) * 60 * 60 * 1000);
  return { start, end };
}

function sumSlotHours(slots: PlanningSlot[]): number {
  return slots.reduce((acc, slot) => acc + computeSlotHours(slot), 0);
}

function defaultNewSlotEnd(start: Date, estimatedHours: number, placedHours: number): Date {
  const remaining = estimatedHours > 0 ? Math.max(0.5, estimatedHours - placedHours) : 2;
  const durationHours = Math.min(remaining, 2, estimatedHours > 0 ? estimatedHours : 2);
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000);
}

function PlanningEventCell(
  props: EventProps<PlanningCalendarEvent> & { onRemoveSlot?: (index: number) => void },
) {
  const { event, onRemoveSlot } = props;
  const isMine = event.resource.kind === "mine";

  return (
    <div className="flex h-full min-h-[18px] items-start justify-between gap-0.5 px-1 py-0.5">
      <span className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-tight">{event.title}</span>
      {isMine && onRemoveSlot && event.resource.slotIndex !== undefined ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemoveSlot(event.resource.slotIndex!);
          }}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-black/10"
          aria-label="Retirer"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      ) : null}
    </div>
  );
}

function PlanningCalendarInner({
  events,
  date,
  onNavigate,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  onRemoveSlot,
  localizer,
  messages,
}: DragDropCalendarProps) {
  return (
    <DnDCalendar
      localizer={localizer}
      events={events}
      date={date}
      onNavigate={onNavigate}
      startAccessor={(event) => event.start}
      endAccessor={(event) => event.end}
      titleAccessor={(event) => event.title}
      views={["week"]}
      view="week"
      toolbar={false}
      selectable
      resizable
      step={30}
      timeslots={2}
      min={new Date(1970, 0, 1, 8, 0, 0)}
      max={new Date(1970, 0, 1, 20, 0, 0)}
      scrollToTime={new Date(1970, 0, 1, 9, 0, 0)}
      dayLayoutAlgorithm="no-overlap"
      messages={messages}
      onSelectSlot={onSelectSlot}
      onEventDrop={onEventDrop}
      onEventResize={onEventResize}
      draggableAccessor={(event) => event.resource.kind === "mine"}
      resizableAccessor={(event) => event.resource.kind === "mine"}
      components={{
        event: (props) => <PlanningEventCell {...props} onRemoveSlot={onRemoveSlot} />,
      }}
      eventPropGetter={(event) => {
        if (event.resource.kind === "existing") {
          return {
            className: "new-task-planning-cal__event--existing",
            style: {
              backgroundColor: "color-mix(in srgb, var(--foreground) 10%, var(--surface))",
              borderColor: "var(--line)",
              color: "var(--ink-muted)",
              borderRadius: "8px",
              fontSize: "10px",
              opacity: 0.9,
              cursor: "default",
            },
          };
        }
        return {
          className: "new-task-planning-cal__event--mine",
          style: {
            backgroundColor: "color-mix(in srgb, var(--accent) 22%, var(--surface))",
            borderColor: "color-mix(in srgb, var(--accent) 45%, var(--line))",
            color: "var(--accent-strong)",
            borderRadius: "8px",
            fontSize: "10px",
            cursor: "grab",
          },
        };
      }}
    />
  );
}

export default function NewTaskPlanningCalendar({
  estimatedHours,
  slots,
  existingSlots,
  onChange,
}: Props) {
  const { t, locale } = useTranslation();
  const isClient = useIsClient();
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());

  const dateLocale = useMemo(() => getDateFnsLocale(locale), [locale]);
  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1, locale: dateLocale }),
        getDay,
        locales: { [locale]: dateLocale },
      }),
    [dateLocale, locale],
  );

  const weekStart = useMemo(
    () => startOfWeek(weekAnchor, { weekStartsOn: 1, locale: dateLocale }),
    [weekAnchor, dateLocale],
  );

  const placedHours = useMemo(() => sumSlotHours(slots), [slots]);
  const remaining =
    estimatedHours > 0 ? Math.max(0, estimatedHours - placedHours) : 0;

  const weekLabel = `${format(weekStart, "d MMM", { locale: dateLocale })} – ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: dateLocale })}`;

  const calendarEvents = useMemo<PlanningCalendarEvent[]>(() => {
    const mine: PlanningCalendarEvent[] = slots.map((slot, index) => {
      const { start, end } = slotToRange(slot);
      const hours = computeSlotHours(slot);
      return {
        id: `mine-${index}`,
        title: `${hours % 1 === 0 ? hours : hours.toFixed(1)} h`,
        start,
        end,
        resource: { kind: "mine", slotIndex: index },
      };
    });

    const existing: PlanningCalendarEvent[] = [];
    for (const [i, slot] of existingSlots.entries()) {
      if (!slot.date) continue;
      const { start, end } = slotToRange({
        date: slot.date,
        hours: slot.hours,
        startTime: "09:00",
        endTime: undefined,
      });
      existing.push({
        id: `existing-${i}-${slot.date}`,
        title: `${slot.title} · ${slot.hours % 1 === 0 ? slot.hours : slot.hours.toFixed(1)}h`,
        start,
        end,
        resource: { kind: "existing", existingTitle: slot.title },
      });
    }

    return [...existing, ...mine];
  }, [slots, existingSlots]);

  const messages = useMemo(
    () => ({
      today: t("agenda.calendar.messages.today"),
      previous: t("agenda.calendar.messages.previous"),
      next: t("agenda.calendar.messages.next"),
      week: t("agenda.calendar.messages.week"),
      noEventsInRange: "",
    }),
    [t],
  );

  const handleSelectSlot = useCallback(
    (info: SlotInfo) => {
      const start = info.start;
      let end = info.end;
      if (end.getTime() - start.getTime() < 30 * 60 * 1000) {
        end = defaultNewSlotEnd(start, estimatedHours, placedHours);
      }
      onChange([...slots, slotFromStartEnd(start, end)]);
    },
    [estimatedHours, onChange, placedHours, slots],
  );

  const handleEventDrop = useCallback(
    ({ event, start, end }: EventInteractionArgs<PlanningCalendarEvent>) => {
      if (event.resource.kind !== "mine" || event.resource.slotIndex === undefined) return;
      const idx = event.resource.slotIndex;
      const startDate = start instanceof Date ? start : new Date(start);
      const endDate = end instanceof Date ? end : new Date(end);
      const updated = slotFromStartEnd(startDate, endDate);
      onChange(slots.map((s, i) => (i === idx ? updated : s)));
    },
    [onChange, slots],
  );

  const handleEventResize = useCallback(
    ({ event, start, end }: EventInteractionArgs<PlanningCalendarEvent>) => {
      if (event.resource.kind !== "mine" || event.resource.slotIndex === undefined) return;
      const idx = event.resource.slotIndex;
      const startDate = start instanceof Date ? start : new Date(start);
      const endDate = end instanceof Date ? end : new Date(end);
      const updated = slotFromStartEnd(startDate, endDate);
      onChange(slots.map((s, i) => (i === idx ? updated : s)));
    },
    [onChange, slots],
  );

  const handleRemoveSlot = useCallback(
    (index: number) => {
      onChange(slots.filter((_, i) => i !== index));
    },
    [onChange, slots],
  );

  if (!isClient) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-[var(--line)] text-sm text-[var(--ink-muted)]">
        {t("agenda.calendar.loading")}
      </div>
    );
  }

  return (
    <div className="new-task-planning-cal flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {estimatedHours > 0 ? (
          <p className="text-xs font-medium text-[var(--foreground)]">
            {t("newTaskModal.planningRemaining")}{" "}
            <span className={remaining > 0 ? "text-[var(--accent)]" : "text-[color:var(--foreground)]/70"}>
              {remaining % 1 === 0 ? remaining : remaining.toFixed(1)} h
            </span>
            {" / "}
            {estimatedHours % 1 === 0 ? estimatedHours : estimatedHours.toFixed(1)} h
          </p>
        ) : (
          <p className="text-xs font-medium text-[color:var(--foreground)]/70">
            {t("newTaskModal.planningFree")}
          </p>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekAnchor((prev) => addWeeks(prev, -1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 transition hover:bg-[var(--surface-soft)]"
            aria-label={t("agenda.calendar.messages.previous")}
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
            aria-label={t("agenda.calendar.messages.next")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-[11px] leading-snug text-[var(--ink-muted)]">{t("newTaskModal.planningCalendarHint")}</p>

      <div className="h-[min(42vh,380px)] min-h-[280px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
        <PlanningCalendarInner
          events={calendarEvents}
          date={weekAnchor}
          onNavigate={setWeekAnchor}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onRemoveSlot={handleRemoveSlot}
          localizer={localizer}
          messages={messages}
        />
      </div>
    </div>
  );
}
