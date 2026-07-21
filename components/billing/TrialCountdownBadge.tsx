"use client";

import { formatTrialCountdownClock, type TrialCountdownParts } from "../../lib/billing/trialCountdown";
import { useTranslation } from "../../lib/i18n/useTranslation";

type TrialCountdownBadgeProps = {
  parts: TrialCountdownParts;
};

export default function TrialCountdownBadge({ parts }: TrialCountdownBadgeProps) {
  const { t } = useTranslation();
  const clock = formatTrialCountdownClock(parts);
  const showDays = parts.days > 0;

  const ariaLabel = showDays
    ? t("nav.billing.countdownAriaDays", {
        days: parts.days,
        time: clock,
      })
    : t("nav.billing.countdownAriaTime", { time: clock });

  return (
    <div className="ui-sidebar-billing__countdown shrink-0 text-right" aria-label={ariaLabel}>
      {showDays ? (
        <>
          <p className="font-[family-name:var(--font-display)] text-[1.65rem] leading-none tracking-[-0.03em] text-[var(--accent-on-dark)] tabular-nums">
            {parts.days}
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[10px] leading-none tracking-[0.04em] text-[var(--accent-on-dark)] tabular-nums opacity-85">
            {clock}
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.12em] opacity-60">
            {t("nav.billing.daysLabel")}
          </p>
        </>
      ) : (
        <>
          <p className="font-[family-name:var(--font-display)] text-[1.35rem] leading-none tracking-[-0.02em] text-[var(--accent-on-dark)] tabular-nums">
            {clock}
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.12em] opacity-60">
            {t("nav.billing.countdownLastDay")}
          </p>
        </>
      )}
    </div>
  );
}
