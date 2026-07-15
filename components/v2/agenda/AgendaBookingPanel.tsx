"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Link2, PauseCircle, PlayCircle } from "lucide-react";
import { updateAgendaSettings, type UpdateAgendaSettingsInput } from "../../../app/actions/agenda";
import type { AgendaSettings } from "../../../lib/agenda/agendaTypes";
import { WEEKDAY_LABELS, type WeekdayKey } from "../../../lib/agenda/agendaTypes";
import { toastError, toastSuccess } from "../../../lib/toast";

type AgendaBookingPanelProps = {
  settings: AgendaSettings;
  onUpdated: () => void;
};

export default function AgendaBookingPanel({ settings, onUpdated }: AgendaBookingPanelProps) {
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${settings.publicPath}`
      : settings.publicPath;

  const patch = (input: UpdateAgendaSettingsInput) => {
    setDraft((prev) => ({
      ...prev,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.welcomeMessage !== undefined ? { welcomeMessage: input.welcomeMessage } : {}),
      ...(input.slotDurationMinutes !== undefined
        ? { slotDurationMinutes: input.slotDurationMinutes }
        : {}),
      ...(input.bufferMinutes !== undefined ? { bufferMinutes: input.bufferMinutes } : {}),
      ...(input.bookingHorizonDays !== undefined
        ? { bookingHorizonDays: input.bookingHorizonDays }
        : {}),
      ...(input.minNoticeHours !== undefined ? { minNoticeHours: input.minNoticeHours } : {}),
      ...(input.autoConfirm !== undefined ? { autoConfirm: input.autoConfirm } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.workHours !== undefined ? { workHours: input.workHours } : {}),
    }));
  };

  const updateDay = (key: WeekdayKey, field: "enabled" | "start" | "end", value: boolean | string) => {
    setDraft((prev) => ({
      ...prev,
      workHours: {
        ...prev.workHours,
        [key]: {
          ...prev.workHours[key],
          [field]: value,
        },
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    const result = await updateAgendaSettings(settings.id, {
      title: draft.title,
      welcomeMessage: draft.welcomeMessage,
      slotDurationMinutes: draft.slotDurationMinutes,
      bufferMinutes: draft.bufferMinutes,
      bookingHorizonDays: draft.bookingHorizonDays,
      minNoticeHours: draft.minNoticeHours,
      workHours: draft.workHours,
      autoConfirm: draft.autoConfirm,
      status: draft.status,
    });
    setSaving(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess("Paramètres de réservation enregistrés.");
    onUpdated();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toastSuccess("Lien copié.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError("Copie impossible.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="ui-surface rounded-2xl p-5">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <Link2 className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">Page de réservation publique</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Partagez ce lien pour permettre à vos clients de réserver un créneau en autonomie. Les RDV
          apparaissent automatiquement dans votre calendrier.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={publicUrl} className="ui-input flex-1 font-mono text-xs" />
          <button type="button" onClick={() => void copyLink()} className="ui-btn ui-btn-secondary gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié" : "Copier"}
          </button>
          <a
            href={settings.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-primary gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Aperçu
          </a>
        </div>
        <button
          type="button"
          onClick={() =>
            patch({ status: draft.status === "active" ? "paused" : "active" })
          }
          className="ui-btn ui-btn-secondary mt-3 gap-2 text-xs"
        >
          {draft.status === "active" ? (
            <>
              <PauseCircle className="h-4 w-4" /> Mettre en pause les réservations
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" /> Réactiver les réservations
            </>
          )}
        </button>
      </section>

      <section className="ui-surface space-y-4 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Paramètres</h2>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          Titre public
          <input
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="ui-input"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          Message d&apos;accueil
          <textarea
            value={draft.welcomeMessage}
            onChange={(e) => patch({ welcomeMessage: e.target.value })}
            rows={3}
            className="ui-input"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            Durée créneau (min)
            <input
              type="number"
              min={15}
              max={240}
              step={15}
              value={draft.slotDurationMinutes}
              onChange={(e) => patch({ slotDurationMinutes: Number(e.target.value) })}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            Tampon (min)
            <input
              type="number"
              min={0}
              max={120}
              value={draft.bufferMinutes}
              onChange={(e) => patch({ bufferMinutes: Number(e.target.value) })}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            Horizon (jours)
            <input
              type="number"
              min={7}
              max={180}
              value={draft.bookingHorizonDays}
              onChange={(e) => patch({ bookingHorizonDays: Number(e.target.value) })}
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            Préavis min. (h)
            <input
              type="number"
              min={0}
              max={168}
              value={draft.minNoticeHours}
              onChange={(e) => patch({ minNoticeHours: Number(e.target.value) })}
              className="ui-input"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={draft.autoConfirm}
            onChange={(e) => patch({ autoConfirm: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--line)]"
          />
          Confirmer automatiquement les réservations en ligne
        </label>
      </section>

      <section className="ui-surface space-y-3 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Disponibilités hebdomadaires</h2>
        {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as WeekdayKey[]).map((key) => {
          const day = draft.workHours[key];
          return (
            <div key={key} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] p-3">
              <label className="inline-flex min-w-[7rem] items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => updateDay(key, "enabled", e.target.checked)}
                />
                {WEEKDAY_LABELS[key]}
              </label>
              <input
                type="time"
                value={day.start}
                disabled={!day.enabled}
                onChange={(e) => updateDay(key, "start", e.target.value)}
                className="ui-input w-auto"
              />
              <span className="text-[var(--ink-muted)]">→</span>
              <input
                type="time"
                value={day.end}
                disabled={!day.enabled}
                onChange={(e) => updateDay(key, "end", e.target.value)}
                className="ui-input w-auto"
              />
            </div>
          );
        })}
      </section>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="ui-btn ui-btn-primary"
      >
        {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
      </button>
    </div>
  );
}
