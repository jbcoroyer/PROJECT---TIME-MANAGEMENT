"use client";

import type { BillingInterval } from "../../lib/billing/plans";
import { useTranslation } from "../../lib/i18n/useTranslation";

export default function BillingIntervalToggle(props: {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const { value, onChange, className = "" } = props;

  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] p-1",
        className,
      ].join(" ")}
      role="group"
      aria-label={t("pricing.intervalToggleLabel")}
    >
      <button
        type="button"
        onClick={() => onChange("month")}
        aria-pressed={value === "month"}
        className={[
          "ui-transition rounded-full px-3.5 py-1.5 text-xs font-semibold",
          value === "month"
            ? "bg-[var(--foreground)] text-[var(--accent-contrast)] shadow-sm"
            : "text-[color:var(--foreground)]/65 hover:text-[var(--foreground)]",
        ].join(" ")}
      >
        {t("pricing.intervalMonthly")}
      </button>
      <button
        type="button"
        onClick={() => onChange("year")}
        aria-pressed={value === "year"}
        className={[
          "ui-transition inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold",
          value === "year"
            ? "bg-[var(--foreground)] text-[var(--accent-contrast)] shadow-sm"
            : "text-[color:var(--foreground)]/65 hover:text-[var(--foreground)]",
        ].join(" ")}
      >
        {t("pricing.intervalAnnual")}
        <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--accent-contrast)]">
          {t("pricing.annualSavingsBadge")}
        </span>
      </button>
    </div>
  );
}
