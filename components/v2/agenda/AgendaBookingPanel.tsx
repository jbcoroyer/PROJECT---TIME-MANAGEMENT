"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2, PauseCircle, PlayCircle, Save } from "lucide-react";
import { updateAgendaSettings, type UpdateAgendaSettingsInput } from "../../../app/actions/agenda";
import type { AgendaSettings } from "../../../lib/agenda/agendaTypes";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { OptionChipGroup } from "../../ui/OptionChipGroup";
import { toastError, toastSuccess } from "../../../lib/toast";
import WeeklyAvailabilityEditor from "./WeeklyAvailabilityEditor";
import ModuleToggle from "../../modules/ModuleToggle";

type AgendaBookingPanelProps = {
  settings: AgendaSettings;
  onUpdated: () => void;
};

const SLOT_DURATIONS = [15, 30, 45, 60, 90] as const;
const BUFFER_MINUTES = [0, 5, 10, 15, 30] as const;
const HORIZON_DAYS = [14, 30, 42, 60, 90] as const;
const MIN_NOTICE_HOURS = [1, 2, 4, 12, 24, 48] as const;

function withCurrentOption<T extends number>(options: readonly T[], current: number): T[] {
  if (options.includes(current as T)) return [...options];
  return [...options, current as T].sort((a, b) => a - b);
}

function settingsEqual(a: AgendaSettings, b: AgendaSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function AgendaBookingPanel({ settings, onUpdated }: AgendaBookingPanelProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const dirty = useMemo(() => !settingsEqual(draft, settings), [draft, settings]);

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
    <div className="space-y-5 pb-20">
      <section className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-soft)_90%,var(--surface))_0%,var(--surface)_100%)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)]">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                {t("agenda.booking.publicPage.heroTitle")}
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {t("agenda.booking.publicPage.description")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={settings.publicPath}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn ui-btn-secondary gap-2 text-xs"
            >
              <ExternalLink className="h-4 w-4" />
              {t("agenda.booking.publicPage.preview")}
            </a>
            <button
              type="button"
              onClick={() => patch({ status: draft.status === "active" ? "paused" : "active" })}
              className="ui-btn ui-btn-secondary gap-2 text-xs"
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
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              {t("agenda.booking.publicPage.urlLabel")}
            </p>
            <p className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-sm text-[var(--foreground)]">
              {publicUrl}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="ui-btn ui-btn-primary shrink-0 gap-2 px-5 py-2.5 text-sm font-semibold sm:w-auto"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("agenda.booking.publicPage.copied") : t("agenda.booking.publicPage.copyPrimary")}
          </button>
        </div>
      </section>

      <section className="ui-surface space-y-5 rounded-2xl p-5">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t("agenda.booking.settings.publicContentTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {t("agenda.booking.settings.publicContentHint")}
          </p>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
          {t("agenda.booking.settings.publicTitle")}
          <input
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="ui-input"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--ink-muted)]">
          {t("agenda.booking.settings.welcomeMessage")}
          <textarea
            value={draft.welcomeMessage}
            onChange={(e) => patch({ welcomeMessage: e.target.value })}
            rows={2}
            className="ui-input resize-none"
          />
        </label>
      </section>

      <section className="ui-surface space-y-5 rounded-2xl p-5">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t("agenda.booking.settings.rulesTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {t("agenda.booking.settings.rulesHint")}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--ink-muted)]">
            {t("agenda.booking.settings.slotDuration")}
          </p>
          <OptionChipGroup
            value={draft.slotDurationMinutes}
            options={withCurrentOption(SLOT_DURATIONS, draft.slotDurationMinutes)}
            onChange={(v) => patch({ slotDurationMinutes: v })}
            format={(v) => t("agenda.booking.settings.minutesShort", { value: v })}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--ink-muted)]">
            {t("agenda.booking.settings.buffer")}
          </p>
          <OptionChipGroup
            value={draft.bufferMinutes}
            options={withCurrentOption(BUFFER_MINUTES, draft.bufferMinutes)}
            onChange={(v) => patch({ bufferMinutes: v })}
            format={(v) => t("agenda.booking.settings.minutesShort", { value: v })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--ink-muted)]">
              {t("agenda.booking.settings.horizon")}
            </p>
            <OptionChipGroup
              value={draft.bookingHorizonDays}
              options={withCurrentOption(HORIZON_DAYS, draft.bookingHorizonDays)}
              onChange={(v) => patch({ bookingHorizonDays: v })}
              format={(v) => t("agenda.booking.settings.daysShort", { value: v })}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--ink-muted)]">
              {t("agenda.booking.settings.minNotice")}
            </p>
            <OptionChipGroup
              value={draft.minNoticeHours}
              options={withCurrentOption(MIN_NOTICE_HOURS, draft.minNoticeHours)}
              onChange={(v) => patch({ minNoticeHours: v })}
              format={(v) => t("agenda.booking.settings.hoursShort", { value: v })}
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {t("agenda.booking.settings.autoConfirmLabel")}
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              {draft.autoConfirm
                ? t("agenda.booking.settings.autoConfirmOnHint")
                : t("agenda.booking.settings.autoConfirmOffHint")}
            </p>
          </div>
          <ModuleToggle
            active={draft.autoConfirm}
            onChange={(autoConfirm) => patch({ autoConfirm })}
            label={t("agenda.booking.settings.autoConfirmLabel")}
          />
        </div>
      </section>

      <WeeklyAvailabilityEditor
        value={draft.workHours}
        onChange={(workHours) => patch({ workHours })}
        disabled={saving}
      />

      {dirty ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <p className="text-sm text-[var(--ink-muted)]">{t("agenda.booking.settings.unsavedChanges")}</p>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="ui-btn ui-btn-primary gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? t("agenda.booking.settings.saving") : t("agenda.booking.settings.save")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="ui-btn ui-btn-primary w-full gap-2 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? t("agenda.booking.settings.saving") : t("agenda.booking.settings.save")}
        </button>
      )}
    </div>
  );
}
