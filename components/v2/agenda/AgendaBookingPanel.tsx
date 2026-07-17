"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2, PauseCircle, PlayCircle } from "lucide-react";
import { updateAgendaSettings, type UpdateAgendaSettingsInput } from "../../../app/actions/agenda";
import type { AgendaSettings } from "../../../lib/agenda/agendaTypes";
import type { WeekdayKey } from "../../../lib/agenda/agendaTypes";
import { createDisplayLabelHelpers } from "../../../lib/i18n/displayLabels";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { TimePicker } from "../../ui/TimePicker";
import { toastError, toastSuccess } from "../../../lib/toast";

type AgendaBookingPanelProps = {
  settings: AgendaSettings;
  onUpdated: () => void;
};

export default function AgendaBookingPanel({ settings, onUpdated }: AgendaBookingPanelProps) {
  const { t, locale } = useTranslation();
  const labels = useMemo(() => createDisplayLabelHelpers(locale), [locale]);
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
    toastSuccess(t("agenda.booking.toast.settingsSaved"));
    onUpdated();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toastSuccess(t("agenda.booking.toast.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError(t("agenda.booking.toast.copyFailed"));
    }
  };

  return (
    <div className="space-y-5">
      <section className="ui-surface rounded-2xl p-5">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <Link2 className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">
            {t("agenda.booking.publicPage.title")}
          </h2>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {t("agenda.booking.publicPage.description")}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={publicUrl} className="ui-input flex-1 font-mono text-xs" />
          <button type="button" onClick={() => void copyLink()} className="ui-btn ui-btn-secondary gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("agenda.booking.publicPage.copied") : t("agenda.booking.publicPage.copy")}
          </button>
          <a
            href={settings.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-primary gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t("agenda.booking.publicPage.preview")}
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
              <PauseCircle className="h-4 w-4" /> {t("agenda.booking.publicPage.pause")}
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" /> {t("agenda.booking.publicPage.resume")}
            </>
          )}
        </button>
      </section>

      <section className="ui-surface space-y-4 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {t("agenda.booking.settings.title")}
        </h2>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          {t("agenda.booking.settings.publicTitle")}
          <input
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="ui-input"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
          {t("agenda.booking.settings.welcomeMessage")}
          <textarea
            value={draft.welcomeMessage}
            onChange={(e) => patch({ welcomeMessage: e.target.value })}
            rows={3}
            className="ui-input"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
            {t("agenda.booking.settings.slotDuration")}
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
            {t("agenda.booking.settings.buffer")}
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
            {t("agenda.booking.settings.horizon")}
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
            {t("agenda.booking.settings.minNotice")}
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
          {t("agenda.booking.settings.autoConfirm")}
        </label>
      </section>

      <section className="ui-surface space-y-3 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {t("agenda.booking.settings.weeklyAvailability")}
        </h2>
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
                {labels.agendaWeekday(key)}
              </label>
              <TimePicker
                value={day.start}
                disabled={!day.enabled}
                onChange={(v) => updateDay(key, "start", v)}
                minuteStep={1}
                className="ui-input w-auto"
              />
              <span className="text-[var(--ink-muted)]">→</span>
              <TimePicker
                value={day.end}
                disabled={!day.enabled}
                onChange={(v) => updateDay(key, "end", v)}
                minuteStep={1}
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
        {saving ? t("agenda.booking.settings.saving") : t("agenda.booking.settings.save")}
      </button>
    </div>
  );
}
