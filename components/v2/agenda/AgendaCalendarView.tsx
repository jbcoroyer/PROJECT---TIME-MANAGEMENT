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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AgendaAppointment } from "../../../lib/agenda/agendaTypes";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import { createDisplayLabelHelpers } from "../../../lib/i18n/displayLabels";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { useAgendaAppointments } from "../../../lib/useAgendaAppointments";
import { useIsClient } from "../../../lib/useIsClient";
import "react-big-calendar/lib/css/react-big-calendar.css";

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
  const { t, locale } = useTranslation();
  const dateLocale = useMemo(() => getDateFnsLocale(locale), [locale]);
  const labels = useMemo(() => createDisplayLabelHelpers(locale), [locale]);
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
  const calendarMessages = useMemo(
    () => ({
      today: t("agenda.calendar.messages.today"),
      previous: t("agenda.calendar.messages.previous"),
      next: t("agenda.calendar.messages.next"),
      month: t("agenda.calendar.messages.month"),
      week: t("agenda.calendar.messages.week"),
      day: t("agenda.calendar.messages.day"),
      agenda: t("agenda.calendar.messages.agenda"),
      noEventsInRange: t("agenda.calendar.messages.noEventsInRange"),
    }),
    [t],
  );
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

  const viewLabel = (v: View) => {
    if (v === "agenda") return t("agenda.calendar.views.list");
    if (v === "month") return t("agenda.calendar.views.month");
    if (v === "week") return t("agenda.calendar.views.week");
    return t("agenda.calendar.views.day");
  };

  if (!isClient) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-dashed border-[var(--line)] text-sm text-[var(--ink-muted)]">
        {t("agenda.calendar.loading")}
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
            aria-label={t("agenda.calendar.prevMonthAria")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[10rem] text-center text-sm font-semibold capitalize text-[var(--foreground)]">
            {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
            className="ui-btn ui-btn-ghost h-9 w-9 p-0"
            aria-label={t("agenda.calendar.nextMonthAria")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="ui-btn ui-btn-secondary text-xs"
          >
            {t("agenda.calendar.today")}
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
              {viewLabel(v)}
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
            {t("agenda.calendar.newAppointment")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[var(--ink-muted)]">{t("agenda.calendar.loadingShort")}</p>
      ) : null}

      <div className="agenda-calendar-shell overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2">
        <Calendar
          localizer={localizer}
          culture={locale}
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
          messages={calendarMessages}
          components={{
            event: ({ event }) => {
              const appt = (event as CalendarEvent).resource;
              return (
                <div className="px-1 py-0.5">
                  <div className="truncate font-semibold">{event.title}</div>
                  <div className="truncate text-[10px] opacity-90">
                    {labels.appointmentStatus(appt.status)}
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
