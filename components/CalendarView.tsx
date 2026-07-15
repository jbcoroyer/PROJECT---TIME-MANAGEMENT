"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import {
  format,
  parse,
  startOfDay,
  endOfDay,
  startOfWeek,
  getDay,
  addDays,
} from "date-fns";
import { useRouter } from "next/navigation";
import { fr } from "date-fns/locale";
import { Building2, ChevronLeft, ChevronRight, MapPin, Plus, Trash2, X } from "lucide-react";
import { createEventWithTasks } from "../app/actions/events";
import AdminAvatar from "./AdminAvatar";
import type { Task, AdminId } from "../lib/types";
import type { EventRow } from "../lib/eventTypes";
import { toastError, toastSuccess } from "../lib/toast";
import {
  loadCalendarExtraEvents,
  saveCalendarExtraEvents,
  type CalendarExtraEvent,
} from "../lib/calendarExtraEvents";
import {
  adminAvatarMetaFor,
  adminFilterPillClassFor,
  adminSolidColorFor,
  defaultDomainColor,
  domainCalendarColors,
} from "../lib/kanbanStyles";
import { useColumnVisuals } from "../lib/useColumnVisuals";
import { useReferenceData } from "../lib/useReferenceData";
import { BOARD_COLUMN_PALETTE, setColor as setBoardColumnColor } from "../lib/v2/boardColumns";
import { useIsClient } from "../lib/useIsClient";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1, locale: fr }),
  getDay,
  locales,
});

const CALENDAR_EXTRA_COLOR = domainCalendarColors["🌎 General"] ?? defaultDomainColor;
const CALENDAR_EVENT_COLOR = domainCalendarColors["🎟️ Event"] ?? defaultDomainColor;
const CALENDAR_DEADLINE_COLOR = "var(--danger)";

const CALENDAR_VIEWS: View[] = ["month", "week", "day", "agenda"];
type CalendarEventResource = {
  task?: Task;
  domain?: string;
  isDeadline?: boolean;
  kind: "planning" | "deadline" | "extra" | "event";
  owner: AdminId;
  ownerColor: string;
  columnColor?: string;
  extra?: CalendarExtraEvent;
  linkedEvent?: EventRow;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: CalendarEventResource;
};

function EventCard(props: {
  event: CalendarEvent;
  onTaskContextMenu?: (e: React.MouseEvent, task: Task) => void;
}) {
  const { event, onTaskContextMenu } = props;
  const { task, isDeadline, owner, ownerColor } = event.resource;
  if (!task) return null;

  return (
    <div
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-md px-2 py-1"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onTaskContextMenu?.(e, task);
      }}
    >
      <div className="mb-0.5 flex items-center gap-1">
        <AdminAvatar admin={owner} size="sm" />
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-90">
          {owner.split(" ")[0]}
        </span>
        {isDeadline && (
          <span className="ml-auto rounded-full bg-white/30 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
            deadline
          </span>
        )}
      </div>
      <p className="truncate text-[11px] font-semibold leading-tight">
        {task.projectName || "Sans titre"}
      </p>
      {task.clientName && (
        <p className="truncate text-[9px] opacity-80">{task.clientName}</p>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-80"
        style={{ backgroundColor: event.resource.columnColor ?? ownerColor }}
      />
    </div>
  );
}

function ExtraEventCard(props: { event: CalendarEvent }) {
  const ex = props.event.resource.extra;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-md px-2 py-1">
      <div className="mb-0.5 flex items-center gap-1">
        <span className="rounded bg-white/25 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider">
          Agenda
        </span>
      </div>
      <p className="truncate text-[11px] font-semibold leading-tight">{props.event.title}</p>
      {ex?.location && (
        <p className="flex items-center gap-0.5 truncate text-[9px] opacity-90">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          {ex.location}
        </p>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: `color-mix(in srgb, ${CALENDAR_EXTRA_COLOR} 55%, transparent)` }}
      />
    </div>
  );
}

function LinkedEventCard(props: { event: CalendarEvent }) {
  const se = props.event.resource.linkedEvent;
  if (!se) return null;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-md px-2 py-1">
      <div className="mb-0.5 flex items-center gap-1">
        <span className="rounded bg-white/25 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider">
          Événement
        </span>
      </div>
      <p className="truncate text-[11px] font-semibold leading-tight">{se.name || props.event.title}</p>
      {se.location ? (
        <p className="flex items-center gap-0.5 truncate text-[9px] opacity-90">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          {se.location}
        </p>
      ) : null}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: `color-mix(in srgb, ${CALENDAR_EVENT_COLOR} 55%, transparent)` }}
      />
    </div>
  );
}

function CalendarEventWrapper(props: {
  event: CalendarEvent;
  onTaskContextMenu?: (e: React.MouseEvent, task: Task) => void;
}) {
  if (props.event.resource.kind === "extra") {
    return <ExtraEventCard event={props.event} />;
  }
  if (props.event.resource.kind === "event") {
    return <LinkedEventCard event={props.event} />;
  }
  return <EventCard event={props.event} onTaskContextMenu={props.onTaskContextMenu} />;
}

type TaskColorMenuState = {
  x: number;
  y: number;
  task: Task;
  columnId: string;
  columnLabel: string;
  currentColor: string;
};

function TaskColorContextMenu(props: {
  state: TaskColorMenuState;
  onClose: () => void;
  onPickColor: (color: string) => void;
}) {
  const mounted = useIsClient();
  const { state, onClose, onPickColor } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  if (!mounted) return null;

  const menuWidth = 220;
  const left = Math.min(state.x, window.innerWidth - menuWidth - 12);
  const top = Math.min(state.y, window.innerHeight - 280);

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Fermer le menu"
        className="fixed inset-0 z-[120]"
        onClick={onClose}
      />
      <div
        role="menu"
        className="ui-surface fixed z-[121] w-[220px] rounded-xl border border-[var(--line-strong)] p-3 shadow-[0_18px_48px_rgba(20,17,13,0.18)]"
        style={{ left, top }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/45">
          Couleur
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--foreground)]">
          {state.task.projectName || "Sans titre"}
        </p>
        <p className="mt-0.5 text-[11px] text-[color:var(--foreground)]/55">
          Colonne « {state.columnLabel} » — synchronisée avec le Kanban
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {BOARD_COLUMN_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              role="menuitem"
              title={color}
              onClick={() => onPickColor(color)}
              className={[
                "h-7 w-7 rounded-full border-2 transition hover:scale-105",
                state.currentColor === color ? "border-[var(--foreground)]" : "border-transparent",
              ].join(" ")}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

function Toolbar(props: {
  label: string;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: View) => void;
  view: View;
  onAddManual: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => props.onNavigate("PREV")}
          aria-label="Période précédente"
          className="ui-transition flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => props.onNavigate("TODAY")}
          className="ui-transition rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm font-semibold text-[color:var(--foreground)]/85 hover:bg-[var(--surface-soft)]"
        >
          Aujourd&apos;hui
        </button>
        <button
          type="button"
          onClick={() => props.onNavigate("NEXT")}
          aria-label="Période suivante"
          className="ui-transition flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        <span className="text-sm font-bold text-[color:var(--foreground)]/85">{props.label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={props.onAddManual}
          className="ui-transition inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--foreground)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)] shadow-sm hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Événement
        </button>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5">
          {CALENDAR_VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => props.onView(v)}
              className={[
                "ui-transition rounded-md px-2.5 py-1 text-xs font-semibold",
                props.view === v
                  ? "bg-[var(--foreground)] text-[var(--accent-contrast)]"
                  : "text-[color:var(--foreground)]/65 hover:bg-[var(--surface-soft)]",
              ].join(" ")}
            >
              {v === "month" ? "Mois" : v === "week" ? "Semaine" : v === "day" ? "Jour" : "Agenda"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type EventModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (ev: CalendarExtraEvent) => Promise<boolean>;
  onDelete?: () => void;
  initial: CalendarExtraEvent | null;
};

function EventModal({ open, onClose, onSave, onDelete, initial }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startVal, setStartVal] = useState("");
  const [endVal, setEndVal] = useState("");

  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => {
      if (initial && initial.start && initial.end) {
        setTitle(initial.title ?? "");
        setLocation(initial.location ?? initial.salon ?? "");
        setNotes(initial.notes ?? "");
        setAllDay(!!initial.allDay);
        setStartVal(toLocalDatetimeValue(new Date(initial.start)));
        setEndVal(toLocalDatetimeValue(new Date(initial.end)));
      } else {
        const s = new Date();
        s.setMinutes(0, 0, 0);
        const e = new Date(s.getTime() + 60 * 60 * 1000);
        setTitle("");
        setLocation("");
        setNotes("");
        setAllDay(false);
        setStartVal(toLocalDatetimeValue(s));
        setEndVal(toLocalDatetimeValue(e));
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    let start = new Date(startVal);
    let end = new Date(endVal);
    if (allDay) {
      const d = new Date(startVal);
      start = startOfDay(d);
      end = endOfDay(d);
    }
    if (end <= start) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
    const persistedId =
      initial?.id && initial.id.length > 0 ? initial.id : crypto.randomUUID();
    const ok = await onSave({
      id: persistedId,
      title: t,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="ui-surface max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--line-strong)] p-5 shadow-2xl"
        role="dialog"
        aria-labelledby="calendar-event-title"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/50">
              Calendrier
            </p>
            <h2 id="calendar-event-title" className="ui-heading mt-1 text-lg font-semibold">
              {initial?.id && initial.id.length > 0 ? "Modifier l'événement" : "Nouvel événement"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--line)] p-1.5 text-[color:var(--foreground)]/55 hover:bg-[var(--surface-soft)]"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
              Titre
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              placeholder="Réunion, point équipe…"
              required
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[color:var(--foreground)]/65">
              <Building2 className="h-3.5 w-3.5" />
              Lieu
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              placeholder="Salle A, visio, Slack…"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="rounded border-[var(--line)]"
            />
            <span className="text-[color:var(--foreground)]/80">Journée entière</span>
          </label>
          {!allDay && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                  Début
                </label>
                <input
                  type="datetime-local"
                  value={startVal}
                  onChange={(e) => setStartVal(e.target.value)}
                  className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-2 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                  Fin
                </label>
                <input
                  type="datetime-local"
                  value={endVal}
                  onChange={(e) => setEndVal(e.target.value)}
                  className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-2 text-xs"
                />
              </div>
            </div>
          )}
          {allDay && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                Date
              </label>
              <input
                type="date"
                value={startVal.slice(0, 10)}
                onChange={(e) => {
                  const d = e.target.value;
                  setStartVal(`${d}T09:00`);
                  setEndVal(`${d}T18:00`);
                }}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="ui-focus-ring w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              placeholder="Ordre du jour, lien…"
            />
          </div>
          <p className="text-[10px] text-[color:var(--foreground)]/45">
            Les nouveaux événements créés ici sont ajoutés au hub événementiel.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {initial?.id && initial.id.length > 0 && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="ui-transition ui-btn ui-btn-outline-danger inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ui-transition ml-auto rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="ui-transition rounded-xl border border-[var(--line-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:opacity-90"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarView(props: {
  tasks: Task[];
  admins: string[];
  currentUserName?: string | null;
  calendarEvents?: EventRow[];
  onSelectTask: (taskId: string) => void;
}) {
  const router = useRouter();
  const { colorFor } = useColumnVisuals();
  const { columns: columnRecords } = useReferenceData();
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [filterAdmin, setFilterAdmin] = useState<AdminId | "Tous">("Tous");
  const [extraEvents, setExtraEvents] = useState<CalendarExtraEvent[]>([]);
  const [extraEventsLoaded, setExtraEventsLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<CalendarExtraEvent | null>(null);
  const [colorMenu, setColorMenu] = useState<TaskColorMenuState | null>(null);
  const [colorSaving, setColorSaving] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setExtraEvents(loadCalendarExtraEvents());
      setExtraEventsLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!extraEventsLoaded) return;
    saveCalendarExtraEvents(extraEvents);
  }, [extraEvents, extraEventsLoaded]);

  const defaultOwner = ((props.currentUserName && props.admins.includes(props.currentUserName)
    ? props.currentUserName
    : props.admins[0]) ?? "") as AdminId;

  const openNewEvent = useCallback((range?: { start: Date; end: Date }) => {
    if (range) {
      setEditingExtra({
        id: "",
        title: "",
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      });
    } else {
      setEditingExtra(null);
    }
    setModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      openNewEvent({ start, end });
    },
    [openNewEvent],
  );

  const handleSaveExtra = useCallback(async (ev: CalendarExtraEvent) => {
    const isExistingLocalExtra = extraEvents.some((x) => x.id === ev.id);
    if (isExistingLocalExtra) {
      const id = ev.id || crypto.randomUUID();
      const next = { ...ev, id };
      setExtraEvents((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = next;
          return copy;
        }
        return [...prev, next];
      });
      setEditingExtra(null);
      return true;
    }

    const startDate = format(new Date(ev.start), "yyyy-MM-dd");
    const endDate = format(new Date(ev.end), "yyyy-MM-dd");
    const result = await createEventWithTasks({
      name: ev.title.trim(),
      location: ev.location?.trim() ?? ev.salon?.trim() ?? "",
      startDate,
      endDate,
      status: "En préparation",
      allocatedBudget: 0,
    });

    if (!result.ok) {
      toastError(result.error);
      return false;
    }
    toastSuccess("Événement ajouté au hub événementiel");
    setEditingExtra(null);
    return true;
  }, [extraEvents]);

  const handleDeleteExtra = useCallback((id: string) => {
    setExtraEvents((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const handleTaskContextMenu = useCallback(
    (e: React.MouseEvent, task: Task) => {
      const column = columnRecords.find((col) => col.name === task.column);
      if (!column?.id || column.id.startsWith("temp-")) {
        toastError("Colonne introuvable pour cette tâche.");
        return;
      }
      setColorMenu({
        x: e.clientX,
        y: e.clientY,
        task,
        columnId: column.id,
        columnLabel: column.name,
        currentColor: column.color?.trim() || colorFor(task.column),
      });
    },
    [columnRecords, colorFor],
  );

  const handlePickColumnColor = useCallback(
    async (color: string) => {
      if (!colorMenu || colorSaving) return;
      setColorSaving(true);
      try {
        await setBoardColumnColor(colorMenu.columnId, color);
        toastSuccess(`Couleur de « ${colorMenu.columnLabel} » mise à jour`);
        setColorMenu(null);
      } catch {
        toastError("Impossible de changer la couleur.");
      } finally {
        setColorSaving(false);
      }
    },
    [colorMenu, colorSaving],
  );

  const TaskEventComponent = useCallback(
    (eventProps: { event: CalendarEvent }) => (
      <CalendarEventWrapper event={eventProps.event} onTaskContextMenu={handleTaskContextMenu} />
    ),
    [handleTaskContextMenu],
  );

  const visibleTasks = useMemo(
    () =>
      filterAdmin === "Tous"
        ? props.tasks
        : props.tasks.filter((t) => t.admins.includes(filterAdmin)),
    [props.tasks, filterAdmin],
  );

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    for (const task of visibleTasks) {
      const owner = (task.admins[0] ?? props.admins[0] ?? "") as AdminId;
      const ownerColor = adminAvatarMetaFor(owner).calendarColor;
      const columnColor = colorFor(task.column);

      for (const item of task.projectedWork || []) {
        if (!item.date || item.hours <= 0) continue;
        const d = parse(item.date, "yyyy-MM-dd", new Date());
        let start: Date;
        let end: Date;
        if (item.startTime && item.endTime) {
          const [sh, sm] = item.startTime.split(":").map(Number);
          const [eh, em] = item.endTime.split(":").map(Number);
          start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh || 9, sm || 0, 0);
          end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh || 10, em || 0, 0);
          if (end <= start) {
            end = new Date(start.getTime() + item.hours * 60 * 60 * 1000);
          }
        } else {
          start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
          end = new Date(start.getTime() + item.hours * 60 * 60 * 1000);
        }
        result.push({
          id: `${task.id}-work-${item.date}`,
          title: `${item.hours}h – ${task.projectName || "Sans titre"}`,
          start,
          end,
          resource: {
            task,
            domain: task.domain,
            isDeadline: false,
            kind: "planning",
            owner,
            ownerColor,
            columnColor,
          },
        });
      }

      if (task.deadline) {
        const d = parse(task.deadline, "yyyy-MM-dd", new Date());
        result.push({
          id: `${task.id}-deadline`,
          title: `À rendre : ${task.projectName || "Sans titre"}`,
          start: startOfDay(d),
          end: endOfDay(d),
          allDay: true,
          resource: {
            task,
            domain: task.domain,
            isDeadline: true,
            kind: "deadline",
            owner,
            ownerColor,
            columnColor,
          },
        });
      }
    }

    for (const ex of extraEvents) {
      const start = new Date(ex.start);
      const end = new Date(ex.end);
      result.push({
        id: `extra-${ex.id}`,
        title: ex.title,
        start,
        end,
        allDay: ex.allDay,
        resource: {
          kind: "extra",
          owner: defaultOwner,
          ownerColor: CALENDAR_EXTRA_COLOR,
          extra: ex,
        },
      });
    }

    const linked = props.calendarEvents ?? [];
    for (const ev of linked) {
      if (!ev.startDate || !ev.endDate) continue;
      const startD = parse(ev.startDate, "yyyy-MM-dd", new Date());
      const endD = parse(ev.endDate, "yyyy-MM-dd", new Date());
      if (Number.isNaN(startD.getTime()) || Number.isNaN(endD.getTime())) continue;
      const start = startOfDay(startD);
      const endExclusive = addDays(startOfDay(endD), 1);
      if (endExclusive <= start) continue;
      result.push({
        id: `event-${ev.id}`,
        title: ev.name || "Événement",
        start,
        end: endExclusive,
        allDay: true,
        resource: {
          kind: "event",
          owner: defaultOwner,
          ownerColor: CALENDAR_EVENT_COLOR,
          linkedEvent: ev,
        },
      });
    }

    return result;
  }, [visibleTasks, props.admins, extraEvents, defaultOwner, props.calendarEvents, colorFor]);

  const CustomToolbar = useCallback(
    (tbProps: {
      label: string;
      onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
      onView: (view: View) => void;
      view: View;
    }) => (
      <Toolbar
        label={tbProps.label}
        onNavigate={tbProps.onNavigate}
        onView={tbProps.onView}
        view={tbProps.view}
        onAddManual={() => openNewEvent()}
      />
    ),
    [openNewEvent],
  );

  return (
    <section className="space-y-4">
      <div className="ui-surface flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/50">
          Collaborateur
        </span>

        <button
          type="button"
          onClick={() => setFilterAdmin("Tous")}
          className={[
            "ui-transition inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold",
            filterAdmin === "Tous"
              ? "border-[var(--line-strong)] bg-[var(--foreground)] text-[var(--background)] shadow-sm"
              : "border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/65 hover:bg-[var(--surface)]",
          ].join(" ")}
        >
          Tous
        </button>

        {props.admins.map((admin) => {
          const isActive = filterAdmin === admin;
          const color = adminSolidColorFor(admin);
          const pillClass = adminFilterPillClassFor(admin);
          return (
            <button
              key={admin}
              type="button"
              onClick={() => setFilterAdmin(isActive ? "Tous" : (admin as AdminId))}
              style={
                isActive
                  ? { borderColor: color, boxShadow: `0 0 0 2px ${color}33` }
                  : {}
              }
              className={[
                "ui-transition inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                pillClass,
                isActive ? "ring-2" : "opacity-75 hover:opacity-100",
              ].join(" ")}
            >
              <AdminAvatar admin={admin as AdminId} size="sm" />
              {admin.split(" ")[0]}
            </button>
          );
        })}

        {filterAdmin !== "Tous" && (
          <button
            type="button"
            onClick={() => setFilterAdmin("Tous")}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2 py-1 text-[10px] text-[color:var(--foreground)]/55 hover:bg-[var(--surface)]"
          >
            <X className="h-3 w-3" />
            Tout afficher
          </button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {props.admins.map((admin) => {
            const color = adminSolidColorFor(admin);
            return (
              <span
                key={admin}
                className="inline-flex items-center gap-1.5 text-[11px] text-[color:var(--foreground)]/65"
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {admin.split(" ")[0]}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[color:var(--foreground)]/55">
            <span className="inline-block h-3 w-3 rounded-full bg-[var(--danger)]" />
            Deadline
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[color:var(--foreground)]/55">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: CALENDAR_EXTRA_COLOR }}
            />
            Agenda perso
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[color:var(--foreground)]/55">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: CALENDAR_EVENT_COLOR }}
            />
            Événement
          </span>
          <span className="text-[11px] text-[color:var(--foreground)]/45">
            Clic droit sur une tâche → couleur de colonne
          </span>
        </div>
      </div>

      <div className="ui-surface overflow-hidden rounded-2xl p-4">
        <div className="h-[min(72vh,780px)] w-full">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            culture="fr"
            views={["month", "week", "day", "agenda"]}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            dayLayoutAlgorithm="no-overlap"
            popup
            selectable
            onSelectSlot={handleSelectSlot}
            min={new Date(1970, 0, 1, 6, 0, 0)}
            max={new Date(1970, 0, 1, 20, 0, 0)}
            scrollToTime={new Date(1970, 0, 1, 8, 0, 0)}
            step={30}
            timeslots={2}
            components={{
              toolbar: CustomToolbar,
              event: TaskEventComponent,
            }}
            onSelectEvent={(event: CalendarEvent) => {
              if (event.resource.kind === "extra" && event.resource.extra) {
                setEditingExtra(event.resource.extra);
                setModalOpen(true);
                return;
              }
              if (event.resource.kind === "event" && event.resource.linkedEvent) {
                router.push(`/events/${event.resource.linkedEvent.id}`);
                return;
              }
              if (event.resource.task) {
                props.onSelectTask(event.resource.task.id);
              }
            }}
            eventPropGetter={(event: CalendarEvent) => {
              const { owner, isDeadline, ownerColor, kind } = event.resource;
              if (kind === "extra") {
                return {
                  style: {
                    backgroundColor: CALENDAR_EXTRA_COLOR,
                    borderColor: `${CALENDAR_EXTRA_COLOR}cc`,
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "2px 4px",
                    fontSize: "11px",
                  },
                };
              }
              if (kind === "event") {
                return {
                  style: {
                    backgroundColor: CALENDAR_EVENT_COLOR,
                    borderColor: `${CALENDAR_EVENT_COLOR}cc`,
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "2px 4px",
                    fontSize: "11px",
                  },
                };
              }
              const color =
                event.resource.columnColor ||
                ownerColor ||
                adminAvatarMetaFor(owner).calendarColor ||
                domainCalendarColors[event.resource.domain ?? ""] ||
                defaultDomainColor;
              if (isDeadline) {
                return {
                  style: {
                    backgroundColor: CALENDAR_DEADLINE_COLOR,
                    borderColor: "color-mix(in srgb, var(--danger) 85%, var(--foreground))",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "2px 4px",
                    fontSize: "11px",
                    borderLeft: `4px solid ${event.resource.columnColor ?? CALENDAR_DEADLINE_COLOR}`,
                  },
                };
              }
              return {
                style: {
                  backgroundColor: color,
                  borderColor: `${color}cc`,
                  color: "#fff",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${event.resource.columnColor ?? color}`,
                  padding: "2px 4px",
                },
              };
            }}
          />
        </div>
      </div>

      <EventModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExtra(null);
        }}
        initial={editingExtra}
        onSave={handleSaveExtra}
        onDelete={
          editingExtra?.id && editingExtra.id.length > 0
            ? () => handleDeleteExtra(editingExtra.id)
            : undefined
        }
      />

      {colorMenu ? (
        <TaskColorContextMenu
          state={colorMenu}
          onClose={() => setColorMenu(null)}
          onPickColor={(color) => void handlePickColumnColor(color)}
        />
      ) : null}
    </section>
  );
}
