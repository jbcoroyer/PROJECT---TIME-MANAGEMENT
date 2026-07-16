"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck2, CalendarX2, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { outlookCallbackUrl, PRODUCTION_APP_URL } from "../lib/config/deployment";
import { requestOutlookSyncAll } from "../lib/outlookClientSync";
import { getPublicAppOrigin } from "../lib/publicAppUrl";
import { useBranding } from "../lib/brandingContext";
import { toastError, toastSuccess } from "../lib/toast";
import { useTranslation } from "../lib/i18n/useTranslation";

type StatusResponse = {
  configured: boolean;
  connected: boolean;
  email?: string | null;
  requiresPro?: boolean;
};

export default function OutlookConnectionCard() {
  const { t } = useTranslation();
  const { branding } = useBranding();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/outlook/status", { cache: "no-store" });
      const data = (await res.json()) as StatusResponse;
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSyncAll = useCallback(async () => {
    setBusy(true);
    try {
      const result = await requestOutlookSyncAll();
      if (!result.ok) {
        toastError(result.error ?? t("outlook.toast.syncError"));
        return;
      }
      if (!result.connected) {
        toastError(t("outlook.toast.notConnected"));
        return;
      }
      if ((result.errors ?? 0) > 0) {
        toastError(
          t("outlook.toast.partialSync", {
            synced: result.synced ?? 0,
            errors: result.errors ?? 0,
            cause: result.firstError ?? t("outlook.toast.unknownCause"),
          }),
        );
        return;
      }
      if ((result.considered ?? 0) === 0) {
        toastError(
          t("outlook.toast.noTasks", {
            scanned: result.scanned ?? 0,
          }),
        );
        return;
      }
      toastSuccess(t("outlook.toast.synced", { count: result.synced ?? 0 }));
    } finally {
      setBusy(false);
    }
  }, [t]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const outlook = params.get("outlook");
    if (!outlook) return;
    if (outlook === "connected") {
      toastSuccess(t("outlook.toast.connected"));
      void requestOutlookSyncAll().then((result) => {
        if (result.ok && (result.synced ?? 0) > 0) {
          toastSuccess(t("outlook.toast.scheduledSent", { count: result.synced ?? 0 }));
        }
      });
    } else if (outlook === "not_configured")
      toastError(t("outlook.toast.msNotConfigured"));
    else if (outlook === "state_mismatch") toastError(t("outlook.toast.oauthFailed"));
    else if (outlook === "error") toastError(t("outlook.toast.connectFailed"));
    params.delete("outlook");
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [t]);

  const handleDisconnect = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/outlook/disconnect", { method: "POST" });
      if (!res.ok) throw new Error();
      toastSuccess(t("outlook.toast.disconnected"));
      await loadStatus();
    } catch {
      toastError(t("outlook.toast.disconnectError"));
    } finally {
      setBusy(false);
    }
  }, [loadStatus, t]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[color:var(--foreground)]/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("outlook.loading")}
      </div>
    );
  }

  if (status && !status.configured) {
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    return (
      <div className="ui-alert ui-alert-warning rounded-xl px-4 py-3 text-sm">
        {t("outlook.notConfigured")}{" "}
        <code className="mx-1 rounded bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface))] px-1">MS_CLIENT_ID</code>,{" "}
        <code className="mx-1 rounded bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface))] px-1">MS_CLIENT_SECRET</code>{" "}
        <code className="mx-1 rounded bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface))] px-1">MS_TENANT_ID</code>{" "}
        {isLocal ? (
          <>
            {t("outlook.envLocal")}
          </>
        ) : (
          <>
            {t("outlook.envVercel")}{" "}
            <code className="mx-1 rounded bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface))] px-1 break-all">
              {outlookCallbackUrl(getPublicAppOrigin() || PRODUCTION_APP_URL)}
            </code>{" "}
            {t("outlook.envAzure")}
          </>
        )}
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))] text-[var(--success)]">
            <CalendarCheck2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{t("outlook.connected")}</p>
            <p className="text-xs text-[color:var(--foreground)]/60">
              {status.email ?? t("outlook.accountFallback")} · {t("outlook.category")}{" "}
              <strong>{branding.outlookCategoryName}</strong> {t("outlook.inOutlook")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSyncAll()}
            disabled={busy}
            className="ui-transition flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface)] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {t("outlook.sync")}
          </button>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="ui-transition flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface)]"
          >
            {t("outlook.refresh")}
          </button>
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={busy}
            className="ui-transition ui-btn ui-btn-outline-danger flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarX2 className="h-3.5 w-3.5" />}
            {t("outlook.disconnect")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-md text-sm text-[color:var(--foreground)]/65">
        {t("outlook.connectDescription")}
      </p>
      <a
        href={`${getPublicAppOrigin() || ""}/api/outlook/connect`}
        className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:opacity-90"
      >
        <ExternalLink className="h-4 w-4" />
        {t("outlook.connect")}
      </a>
    </div>
  );
}
