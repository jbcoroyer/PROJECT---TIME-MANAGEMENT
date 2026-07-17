"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, RefreshCw, Shield } from "lucide-react";
import { listPlatformOrganizations, type PlatformOrgRow } from "../../app/actions/platform";
import { BILLING_STATUS_LABELS, PLAN_LABELS, type BillingStatus, type OrgPlan } from "../../lib/billing/plans";
import { getIntlLocale } from "../../lib/i18n/dateFnsLocale";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { toastError } from "../../lib/toast";

export default function PlatformAdminPage() {
  const { t, locale } = useTranslation();
  const [rows, setRows] = useState<PlatformOrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listPlatformOrganizations();
      if (!result.ok) throw new Error(result.error);
      setRows(result.organizations);
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("platform.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="ui-surface rounded-2xl px-5 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--foreground)]/45">
              {t("platform.kicker")}
            </p>
            <h1 className="ui-display mt-1 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              {t("platform.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--foreground)]/60">{t("platform.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t("platform.refresh")}
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--surface-soft)]/60 text-xs uppercase tracking-wide text-[color:var(--foreground)]/50">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("platform.colOrganization")}</th>
                <th className="px-4 py-3 font-semibold">{t("platform.colPlan")}</th>
                <th className="px-4 py-3 font-semibold">{t("platform.colBilling")}</th>
                <th className="px-4 py-3 font-semibold">{t("platform.colMembers")}</th>
                <th className="px-4 py-3 font-semibold">{t("platform.colTrialEnd")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[color:var(--foreground)]/50">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[color:var(--foreground)]/50">
                    {t("platform.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--line)]/70 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[color:var(--foreground)]/35" />
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{row.name}</p>
                          <p className="text-xs text-[color:var(--foreground)]/45">{row.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{PLAN_LABELS[row.plan as OrgPlan] ?? row.plan}</td>
                    <td className="px-4 py-3">
                      {BILLING_STATUS_LABELS[row.billingStatus as BillingStatus] ?? row.billingStatus}
                    </td>
                    <td className="px-4 py-3">{row.memberCount}</td>
                    <td className="px-4 py-3 text-[color:var(--foreground)]/60">
                      {row.trialEndsAt
                        ? new Date(row.trialEndsAt).toLocaleDateString(getIntlLocale(locale))
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-[color:var(--foreground)]/45">
        <Shield className="h-3.5 w-3.5" />
        {t("platform.restricted")}
      </p>
    </div>
  );
}
