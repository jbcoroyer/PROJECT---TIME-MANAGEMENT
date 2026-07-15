"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  getPublicAvailableSlots,
  submitPublicBooking,
  type PublicAgendaMeta,
} from "../../../app/actions/agenda";
import { getBookableDates, slotsForDayLabel } from "../../../lib/agenda/bookingSlots";
import { toastError } from "../../../lib/toast";

type PublicBookingFormProps = {
  meta: PublicAgendaMeta;
};

export default function PublicBookingForm({ meta }: PublicBookingFormProps) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const bookableDates = useMemo(
    () => getBookableDates(new Date(), meta.bookingHorizonDays, meta.workHours),
    [meta.bookingHorizonDays, meta.workHours],
  );

  useEffect(() => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    void getPublicAvailableSlots(meta.settingsId, selectedDate.toISOString())
      .then((result) => {
        if (result.ok) setSlots(result.slots);
        else {
          setSlots([]);
          toastError(result.error);
        }
      })
      .finally(() => setSlotsLoading(false));
  }, [meta.settingsId, selectedDate]);

  const shiftDate = (days: number) => {
    setSelectedDate((d) => addDays(d, days));
  };

  const submit = async () => {
    if (!selectedSlot || !guestName.trim() || !guestEmail.trim() || busy) return;
    setBusy(true);
    const result = await submitPublicBooking(meta.settingsId, {
      slotStart: selectedSlot.start,
      slotEnd: selectedSlot.end,
      guestName,
      guestEmail,
      guestPhone,
      guestMessage,
    });
    setBusy(false);
    if (!result.ok) toastError(result.error);
    else setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-10">
        <div className="mx-auto max-w-lg">
          <div className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--success)]" />
            <h1 className="mt-3 text-xl font-semibold">Réservation confirmée</h1>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Votre créneau avec {meta.appName} est enregistré. Vous recevrez une confirmation à{" "}
              {guestEmail}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-lg space-y-5">
        <div className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            {meta.appName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{meta.title}</h1>
          {meta.welcomeMessage ? (
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{meta.welcomeMessage}</p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            Créneaux de {meta.slotDurationMinutes} minutes
          </p>
        </div>

        <section className="ui-surface rounded-2xl p-5">
          <h2 className="text-sm font-semibold">1. Choisir une date</h2>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => shiftDate(-1)} className="ui-btn ui-btn-ghost h-9 w-9 p-0">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium capitalize">{slotsForDayLabel(selectedDate)}</span>
            <button type="button" onClick={() => shiftDate(1)} className="ui-btn ui-btn-ghost h-9 w-9 p-0">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {bookableDates.slice(0, 14).map((date) => {
              const active = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={[
                    "shrink-0 rounded-xl border px-3 py-2 text-center text-xs",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                      : "border-[var(--line)] text-[var(--ink-muted)]",
                  ].join(" ")}
                >
                  <div>{format(date, "EEE", { locale: fr })}</div>
                  <div className="text-base">{format(date, "d")}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ui-surface rounded-2xl p-5">
          <h2 className="text-sm font-semibold">2. Choisir un horaire</h2>
          {slotsLoading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-[var(--ink-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des créneaux…
            </p>
          ) : slots.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">Aucun créneau disponible ce jour-là.</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const active =
                  selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={[
                      "rounded-lg border px-2 py-2 text-sm font-medium",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : "border-[var(--line)] hover:border-[var(--accent)]",
                    ].join(" ")}
                  >
                    {format(new Date(slot.start), "HH:mm")}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedSlot ? (
          <section className="ui-surface space-y-3 rounded-2xl p-5">
            <h2 className="text-sm font-semibold">3. Vos coordonnées</h2>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
              Nom *
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className="ui-input" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
              E-mail *
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
              Téléphone
              <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="ui-input" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
              Objet / message
              <textarea
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                rows={3}
                className="ui-input"
              />
            </label>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy || !guestName.trim() || !guestEmail.trim()}
              className="ui-btn ui-btn-primary w-full gap-2"
            >
              <CalendarCheck className="h-4 w-4" />
              {busy ? "Réservation…" : "Confirmer le rendez-vous"}
            </button>
            <p className="text-center text-xs text-[var(--ink-muted)]">
              {format(new Date(selectedSlot.start), "EEEE d MMMM · HH:mm", { locale: fr })}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
