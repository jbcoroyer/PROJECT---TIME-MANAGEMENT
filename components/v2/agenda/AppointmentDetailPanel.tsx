"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  StickyNote,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";
import {
  addAppointmentNote,
  cancelAgendaAppointment,
  listAppointmentNotes,
  updateAgendaAppointment,
} from "../../../app/actions/agenda";
import type { AgendaAppointment, AgendaAppointmentNote } from "../../../lib/agenda/agendaTypes";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import { createDisplayLabelHelpers } from "../../../lib/i18n/displayLabels";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { toastError, toastSuccess } from "../../../lib/toast";

type AppointmentDetailPanelProps = {
  appointment: AgendaAppointment | null;
  onClose: () => void;
  onUpdated: () => void;
  onEdit: (appointment: AgendaAppointment) => void;
};

export default function AppointmentDetailPanel({
  appointment,
  onClose,
  onUpdated,
  onEdit,
}: AppointmentDetailPanelProps) {
  const { t, locale } = useTranslation();
  const dateLocale = useMemo(() => getDateFnsLocale(locale), [locale]);
  const labels = useMemo(() => createDisplayLabelHelpers(locale), [locale]);
  const [notes, setNotes] = useState<AgendaAppointmentNote[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [busy, setBusy] = useState(false);

  const appointmentId = appointment?.id ?? null;

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setNotesLoading(true);
    });
    void listAppointmentNotes(appointmentId)
      .then((data) => {
        if (!cancelled) setNotes(data);
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  if (!appointment) return null;

  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);

  const handleAddNote = async () => {
    if (!noteBody.trim() || savingNote) return;
    setSavingNote(true);
    const result = await addAppointmentNote(appointment.id, noteBody);
    setSavingNote(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    setNoteBody("");
    const refreshed = await listAppointmentNotes(appointment.id);
    setNotes(refreshed);
    toastSuccess(t("agenda.detail.toast.noteAdded"));
    onUpdated();
  };

  const handleComplete = async () => {
    setBusy(true);
    const result = await updateAgendaAppointment(appointment.id, { status: "completed" });
    setBusy(false);
    if (!result.ok) toastError(result.error);
    else {
      toastSuccess(t("agenda.detail.toast.completed"));
      onUpdated();
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    const result = await cancelAgendaAppointment(appointment.id);
    setBusy(false);
    if (!result.ok) toastError(result.error);
    else {
      toastSuccess(t("agenda.detail.toast.cancelled"));
      onUpdated();
      onClose();
    }
  };

  return (
    <aside className="ui-surface flex h-full flex-col rounded-2xl border border-[var(--line)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
            {labels.appointmentStatus(appointment.status)}
            {appointment.source === "public_booking" ? t("agenda.detail.publicBookingSuffix") : ""}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{appointment.title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ink-muted)]">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {format(start, "EEE d MMM yyyy · HH:mm", { locale: dateLocale })} – {format(end, "HH:mm")}
          </p>
        </div>
        <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {appointment.guestName ? (
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-[var(--foreground)]">
              <User className="h-4 w-4 text-[var(--accent)]" />
              {appointment.guestName}
            </p>
            {appointment.guestEmail ? (
              <p className="flex items-center gap-2 text-[var(--ink-muted)]">
                <Mail className="h-4 w-4" />
                {appointment.guestEmail}
              </p>
            ) : null}
            {appointment.guestPhone ? (
              <p className="flex items-center gap-2 text-[var(--ink-muted)]">
                <Phone className="h-4 w-4" />
                {appointment.guestPhone}
              </p>
            ) : null}
          </div>
        ) : null}

        {appointment.guestMessage ? (
          <div className="rounded-xl bg-[var(--surface-soft)] p-3 text-sm text-[var(--ink-muted)]">
            <MessageSquare className="mb-1 h-4 w-4 text-[var(--accent)]" />
            {appointment.guestMessage}
          </div>
        ) : null}

        {appointment.location ? (
          <p className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
            <MapPin className="h-4 w-4" />
            {appointment.location}
          </p>
        ) : null}

        {appointment.meetingUrl ? (
          <a
            href={appointment.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            <Video className="h-4 w-4" />
            {t("agenda.detail.joinVideo")}
          </a>
        ) : null}

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            <StickyNote className="h-3.5 w-3.5" />
            {t("agenda.detail.internalNotes")}
          </h3>
          {notesLoading ? (
            <p className="text-xs text-[var(--ink-muted)]">{t("agenda.detail.loading")}</p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)]">{t("agenda.detail.noNotes")}</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
                >
                  <p className="text-[var(--foreground)]">{note.body}</p>
                  <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
                    {format(new Date(note.createdAt), "d MMM yyyy · HH:mm", { locale: dateLocale })}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 space-y-2">
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder={t("agenda.detail.notePlaceholder")}
              className="ui-input w-full text-sm"
            />
            <button
              type="button"
              onClick={() => void handleAddNote()}
              disabled={savingNote || !noteBody.trim()}
              className="ui-btn ui-btn-secondary w-full text-xs"
            >
              {savingNote ? t("agenda.detail.saving") : t("agenda.detail.addNote")}
            </button>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--line)] p-4">
        <button
          type="button"
          onClick={() => onEdit(appointment)}
          className="ui-btn ui-btn-secondary flex-1 text-xs"
        >
          {t("agenda.detail.edit")}
        </button>
        {appointment.status !== "completed" && appointment.status !== "cancelled" ? (
          <button
            type="button"
            onClick={() => void handleComplete()}
            disabled={busy}
            className="ui-btn ui-btn-primary flex-1 gap-1 text-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("agenda.detail.complete")}
          </button>
        ) : null}
        {appointment.status !== "cancelled" ? (
          <button
            type="button"
            onClick={() => void handleCancel()}
            disabled={busy}
            className="ui-btn ui-btn-ghost text-xs text-[var(--danger)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("agenda.detail.cancel")}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
