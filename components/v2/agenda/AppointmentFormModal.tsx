"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import {
  createAgendaAppointment,
  updateAgendaAppointment,
  type CreateAppointmentInput,
} from "../../../app/actions/agenda";
import type { AgendaAppointment } from "../../../lib/agenda/agendaTypes";
import { useReferenceData } from "../../../lib/useReferenceData";
import { toastError, toastSuccess } from "../../../lib/toast";

type AppointmentFormModalProps = {
  open: boolean;
  initialStart?: Date;
  initialEnd?: Date;
  editing?: AgendaAppointment | null;
  onClose: () => void;
  onSaved: () => void;
};

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildInitialFormState(
  editing: AgendaAppointment | null | undefined,
  initialStart?: Date,
  initialEnd?: Date,
) {
  if (editing) {
    return {
      title: editing.title,
      startsAt: toLocalInputValue(new Date(editing.startsAt)),
      endsAt: toLocalInputValue(new Date(editing.endsAt)),
      hostId: editing.hostTeamMemberId ?? "",
      guestName: editing.guestName,
      guestEmail: editing.guestEmail,
      guestPhone: editing.guestPhone,
      guestMessage: editing.guestMessage,
      location: editing.location,
      meetingUrl: editing.meetingUrl,
    };
  }
  const start = initialStart ?? new Date();
  const end = initialEnd ?? new Date(start.getTime() + 30 * 60_000);
  return {
    title: "",
    startsAt: toLocalInputValue(start),
    endsAt: toLocalInputValue(end),
    hostId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestMessage: "",
    location: "",
    meetingUrl: "",
  };
}

function AppointmentFormBody({
  editing,
  initialStart,
  initialEnd,
  onClose,
  onSaved,
}: Omit<AppointmentFormModalProps, "open">) {
  const { admins } = useReferenceData();
  const initial = buildInitialFormState(editing, initialStart, initialEnd);
  const [title, setTitle] = useState(initial.title);
  const [startsAt, setStartsAt] = useState(initial.startsAt);
  const [endsAt, setEndsAt] = useState(initial.endsAt);
  const [hostId, setHostId] = useState(initial.hostId);
  const [guestName, setGuestName] = useState(initial.guestName);
  const [guestEmail, setGuestEmail] = useState(initial.guestEmail);
  const [guestPhone, setGuestPhone] = useState(initial.guestPhone);
  const [guestMessage, setGuestMessage] = useState(initial.guestMessage);
  const [location, setLocation] = useState(initial.location);
  const [meetingUrl, setMeetingUrl] = useState(initial.meetingUrl);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);

    const payload: CreateAppointmentInput = {
      title: title.trim(),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      hostTeamMemberId: hostId || null,
      guestName,
      guestEmail,
      guestPhone,
      guestMessage,
      location,
      meetingUrl,
    };

    const result = editing
      ? await updateAgendaAppointment(editing.id, payload)
      : await createAgendaAppointment(payload);

    setBusy(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(editing ? "Rendez-vous mis à jour." : "Rendez-vous créé.");
    onSaved();
    onClose();
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {editing ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
        </h2>
        <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          Titre *
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="ui-input" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            Début *
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            Fin *
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="ui-input"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          Hôte / responsable
          <select value={hostId} onChange={(e) => setHostId(e.target.value)} className="ui-input">
            <option value="">Non assigné</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            Invité
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="ui-input" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            E-mail
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="ui-input"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          Téléphone
          <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="ui-input" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          Message / objet
          <textarea
            value={guestMessage}
            onChange={(e) => setGuestMessage(e.target.value)}
            rows={2}
            className="ui-input"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          Lieu
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="ui-input" />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          Lien visio
          <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} className="ui-input" />
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="ui-btn ui-btn-secondary">
          Annuler
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !title.trim()}
          className="ui-btn ui-btn-primary"
        >
          {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le RDV"}
        </button>
      </div>

      {startsAt && endsAt ? (
        <p className="mt-2 text-center text-[11px] text-[var(--ink-muted)]">
          {format(new Date(startsAt), "d MMM yyyy · HH:mm")} →{" "}
          {format(new Date(endsAt), "HH:mm")}
        </p>
      ) : null}
    </>
  );
}

export default function AppointmentFormModal({
  open,
  initialStart,
  initialEnd,
  editing,
  onClose,
  onSaved,
}: AppointmentFormModalProps) {
  if (!open) return null;

  const formKey = editing?.id ?? `new-${initialStart?.getTime() ?? 0}-${initialEnd?.getTime() ?? 0}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="ui-surface max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5 shadow-[var(--shadow-2)]">
        <AppointmentFormBody
          key={formKey}
          editing={editing}
          initialStart={initialStart}
          initialEnd={initialEnd}
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
