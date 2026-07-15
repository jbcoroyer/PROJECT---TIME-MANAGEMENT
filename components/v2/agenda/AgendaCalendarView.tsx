"use client";

import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AgendaAppointment } from "../../../lib/agenda/agendaTypes";
import { APPOINTMENT_STATUS_LABELS } from "../../../lib/agenda/agendaTypes";
import { useAgendaAppointments } from "../../../lib/useAgendaAppointments";
import { useIsClient } from "../../../lib/useIsClient";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1, locale: fr }),
  getDay,
  locales,
});

const VIEWS: View[] = ["month", "week", "day", "agenda"];

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: AgendaAppointment;
};

type AgendaCalendarViewProps = {
  onSelectAppointment: (appointment: AgendaAppointment) => void;
  onCreateSlot: (start: Date, end: Date) => void;
};

export default function AgendaCalendarView({
  onSelectAppointment,
  onCreateSlot,
}: AgendaCalendarViewProps) {
  const isClient = useIsClient();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<View>("week");

  const rangeStart = useMemo(() => startOfMonth(addMonths(currentDate, -1)), [currentDate]);
  const rangeEnd = useMemo(() => endOfMonth(addMonths(currentDate, 2)), [currentDate]);
  const { appointments, loading } = useAgendaAppointments(rangeStart, rangeEnd);

  const events = useMemo<CalendarEvent[]>(
    () =>
      appointments
        .filter((a) => a.status !== "cancelled")
        .map((a) => ({
          id: a.id,
          title: a.title,
          start: new Date(a.startsAt),
          end: new Date(a.endsAt),
          resource: a,
        })),
    [appointments],
  );

  const eventStyleGetter = (event: CalendarEvent) => {
    const appt = event.resource;
    const bg = appt.color || "var(--accent)";
    return {
      style: {
        backgroundColor: bg,
        borderColor: bg,
        color: "#fff",
        borderRadius: "8px",
        border: "none",
        fontSize: "12px",
        opacity: appt.status === "completed" ? 0.65 : 1,
      },
    };
  };

  if (!isClient) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-[var(--line)] text-sm text-[var(--ink-muted)]">
        Chargement du calendrier…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentDate((d) => addMonths(d, -1))}
            className="ui-btn ui-btn-ghost h-9 w-9 p-0"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[10rem] text-center text-sm font-semibold capitalize text-[var(--foreground)]">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
            className="ui-btn ui-btn-ghost h-9 w-9 p-0"
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="ui-btn ui-btn-secondary text-xs"
          >
            Aujourd&apos;hui
          </button>
        </div>
        <div className="flex items-center gap-2">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={[
                "ui-btn text-xs capitalize",
                view === v ? "ui-btn-primary" : "ui-btn-secondary",
              ].join(" ")}
            >
              {v === "agenda" ? "Liste" : v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const start = new Date();
              start.setMinutes(0, 0, 0);
              start.setHours(start.getHours() + 1);
              const end = new Date(start.getTime() + 30 * 60_000);
              onCreateSlot(start, end);
            }}
            className="ui-btn ui-btn-primary gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau RDV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[var(--ink-muted)]">Chargement…</p>
      ) : null}

      <div className="agenda-calendar-shell overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2">
        <Calendar
          localizer={localizer}
          culture="fr"
          events={events}
          view={view}
          onView={setView}
          date={currentDate}
          onNavigate={setCurrentDate}
          views={VIEWS}
          step={15}
          timeslots={4}
          min={new Date(1970, 0, 1, 7, 0)}
          max={new Date(1970, 0, 1, 21, 0)}
          selectable
          onSelectEvent={(event) => onSelectAppointment((event as CalendarEvent).resource)}
          onSelectSlot={({ start, end }) => onCreateSlot(start, end)}
          eventPropGetter={(event) => eventStyleGetter(event as CalendarEvent)}
          messages={{
            today: "Aujourd'hui",
            previous: "Préc.",
            next: "Suiv.",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            agenda: "Liste",
            noEventsInRange: "Aucun rendez-vous sur cette période.",
          }}
          components={{
            event: ({ event }) => {
              const appt = (event as CalendarEvent).resource;
              return (
                <div className="px-1 py-0.5">
                  <div className="truncate font-semibold">{event.title}</div>
                  <div className="truncate text-[10px] opacity-90">
                    {APPOINTMENT_STATUS_LABELS[appt.status]}
                    {appt.guestName ? ` · ${appt.guestName}` : ""}
                  </div>
                </div>
              );
            },
          }}
          style={{ height: 560 }}
        />
      </div>
    </div>
  );
}
