"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Check,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Video,
  X,
} from "lucide-react";
import {
  acceptAgendaAppointmentRequest,
  rejectAgendaAppointmentRequest,
} from "../../../app/actions/agenda";
import type { AgendaAppointmentRequest } from "../../../lib/agenda/agendaTypes";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import { useAgendaAppointmentRequests } from "../../../lib/useAgendaAppointmentRequests";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { toastError, toastSuccess } from "../../../lib/toast";

type AgendaRequestsPanelProps = {
  onUpdated: () => void;
};

export default function AgendaRequestsPanel({ onUpdated }: AgendaRequestsPanelProps) {
  const { t, locale } = useTranslation();
  const dateLocale = useMemo(() => getDateFnsLocale(locale), [locale]);
  const { requests, loading, reload } = useAgendaAppointmentRequests();
  const [selected, setSelected] = useState<AgendaAppointmentRequest | null>(null);
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [notifyOnReject, setNotifyOnReject] = useState(true);
  const [busy, setBusy] = useState(false);

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending").slice(0, 8);

  const openAccept = (request: AgendaAppointmentRequest) => {
    setSelected(request);
    setLocation("");
    setMeetingUrl("");
    setCustomMessage("");
    setRejectionReason("");
    setNotifyOnReject(true);
  };

  const closePanel = () => {
    setSelected(null);
    setBusy(false);
  };

  const handleAccept = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const result = await acceptAgendaAppointmentRequest(selected.id, {
      location,
      meetingUrl,
      customMessage,
    });
    setBusy(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(t("agenda.requests.toast.accepted"));
    closePanel();
    await reload();
    onUpdated();
  };

  const handleReject = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const result = await rejectAgendaAppointmentRequest(selected.id, {
      rejectionReason,
      notifyRequester: notifyOnReject,
    });
    setBusy(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(t("agenda.requests.toast.rejected"));
    closePanel();
    await reload();
    onUpdated();
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <section className="ui-surface rounded-2xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Inbox className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {t("agenda.requests.title")}
                </h2>
                <p className="text-xs text-[var(--ink-muted)]">
                  {pending.length === 1
                    ? t("agenda.requests.pendingOne", { count: String(pending.length) })
                    : t("agenda.requests.pendingMany", { count: String(pending.length) })}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("agenda.requests.loading")}
            </p>
          ) : pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-4 py-10 text-center">
              <Check className="mx-auto h-8 w-8 text-[var(--success)]" />
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {t("agenda.requests.emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">{t("agenda.requests.emptyBody")}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pending.map((request) => (
                <li
                  key={request.id}
                  className={[
                    "rounded-xl border p-4 transition-colors",
                    selected?.id === request.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--line)] bg-[var(--surface)]",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--foreground)]">{request.guestName}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(request.requestedStartsAt), "EEE d MMM yyyy · HH:mm", {
                          locale: dateLocale,
                        })}
                      </p>
                      {request.guestEmail ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                          <Mail className="h-3.5 w-3.5" />
                          {request.guestEmail}
                        </p>
                      ) : null}
                      {request.guestMessage ? (
                        <p className="mt-2 line-clamp-2 text-sm text-[var(--ink-muted)]">
                          {request.guestMessage}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => openAccept(request)}
                      className="ui-btn ui-btn-primary text-xs"
                    >
                      {t("agenda.requests.review")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {decided.length > 0 ? (
          <section className="ui-surface rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {t("agenda.requests.recentTitle")}
            </h3>
            <ul className="mt-3 space-y-2">
              {decided.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                >
                  <span className="font-medium">{request.guestName}</span>
                  <span className="text-xs text-[var(--ink-muted)]">
                    {request.status === "accepted"
                      ? t("agenda.requests.statusAccepted")
                      : t("agenda.requests.statusRejected")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <aside className="ui-surface rounded-2xl border border-[var(--line)] p-5">
        {!selected ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
            <Inbox className="h-8 w-8 text-[var(--ink-muted)]" />
            <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
              {t("agenda.requests.panelEmptyTitle")}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">{t("agenda.requests.panelEmptyBody")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                {t("agenda.requests.panelTitle")}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{selected.guestName}</h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {format(new Date(selected.requestedStartsAt), "EEEE d MMMM yyyy · HH:mm", {
                  locale: dateLocale,
                })}
              </p>
            </div>

            <div className="space-y-2 text-sm text-[var(--ink-muted)]">
              {selected.guestEmail ? (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {selected.guestEmail}
                </p>
              ) : null}
              {selected.guestPhone ? (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {selected.guestPhone}
                </p>
              ) : null}
              {selected.guestMessage ? (
                <p className="flex items-start gap-2">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                  {selected.guestMessage}
                </p>
              ) : null}
            </div>

            <section className="space-y-3 border-t border-[var(--line)] pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                {t("agenda.requests.emailSection")}
              </h4>
              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
                {t("agenda.requests.locationLabel")}
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("agenda.requests.locationPlaceholder")}
                  className="ui-input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
                <span className="inline-flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  {t("agenda.requests.videoLabel")}
                </span>
                <input
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://..."
                  className="ui-input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
                {t("agenda.requests.customMessageLabel")}
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  placeholder={t("agenda.requests.customMessagePlaceholder")}
                  className="ui-input"
                />
              </label>
            </section>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleAccept()}
                disabled={busy}
                className="ui-btn ui-btn-primary flex-1 gap-1 text-xs"
              >
                <Check className="h-3.5 w-3.5" />
                {busy ? t("agenda.requests.accepting") : t("agenda.requests.accept")}
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={busy}
                className="ui-btn ui-btn-ghost text-xs text-[var(--danger)]"
              >
                <X className="h-3.5 w-3.5" />
                {t("agenda.requests.reject")}
              </button>
            </div>

            <section className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--ink-muted)]">
                {t("agenda.requests.rejectSection")}
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder={t("agenda.requests.rejectionReasonPlaceholder")}
                className="ui-input w-full text-sm"
              />
              <label className="inline-flex items-center gap-2 text-xs text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={notifyOnReject}
                  onChange={(e) => setNotifyOnReject(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--line)]"
                />
                {t("agenda.requests.notifyOnReject")}
              </label>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
