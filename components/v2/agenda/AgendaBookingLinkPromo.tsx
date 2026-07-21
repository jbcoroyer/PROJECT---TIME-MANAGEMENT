"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Settings2 } from "lucide-react";
import type { AgendaSettings } from "../../../lib/agenda/agendaTypes";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { toastError, toastSuccess } from "../../../lib/toast";

type AgendaBookingLinkPromoProps = {
  settings: AgendaSettings;
  onCustomize: () => void;
  hidden?: boolean;
};

export default function AgendaBookingLinkPromo({
  settings,
  onCustomize,
  hidden = false,
}: AgendaBookingLinkPromoProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (hidden) return null;

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${settings.publicPath}`
      : settings.publicPath;

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

  const isPaused = settings.status !== "active";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-soft)_90%,var(--surface))_0%,var(--surface)_55%,var(--surface-soft)_100%)] p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[var(--accent)]/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent-contrast)]">
              <Link2 className="h-3 w-3" />
              {t("agenda.workspace.bookingPromo.badge")}
            </span>
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                isPaused
                  ? "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
                  : "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[var(--accent)]",
              ].join(" ")}
            >
              {isPaused
                ? t("agenda.workspace.bookingPromo.statusPaused")
                : t("agenda.workspace.bookingPromo.statusActive")}
            </span>
          </div>

          <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {t("agenda.workspace.bookingPromo.title")}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
            {t("agenda.workspace.bookingPromo.description")}
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row xl:w-auto xl:min-w-[17rem] xl:flex-col">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="ui-btn ui-btn-primary w-full gap-2 px-5 py-2.5 text-sm font-semibold sm:flex-1 xl:flex-none"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied
              ? t("agenda.workspace.bookingPromo.copied")
              : t("agenda.workspace.bookingPromo.copy")}
          </button>
          <button
            type="button"
            onClick={onCustomize}
            className="ui-btn ui-btn-secondary w-full gap-2 sm:flex-1 xl:flex-none"
          >
            <Settings2 className="h-4 w-4" />
            {t("agenda.workspace.bookingPromo.customize")}
          </button>
          <a
            href={settings.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-secondary w-full gap-2 sm:flex-1 xl:flex-none"
          >
            <ExternalLink className="h-4 w-4" />
            {t("agenda.workspace.bookingPromo.preview")}
          </a>
        </div>
      </div>

      <div className="relative mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)]/80 p-3 backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
          {t("agenda.workspace.bookingPromo.urlLabel")}
        </p>
        <p className="mt-1 break-all font-[family-name:var(--font-mono)] text-sm text-[var(--foreground)]">
          {publicUrl}
        </p>
      </div>
    </section>
  );
}
