"use client";

import Link from "next/link";
import {
  FLOOR_INCLUDED_SEATS,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_EUR,
  TRIAL_DAYS,
  formatMonthlyPriceEur,
} from "../../lib/billing/plans";
import { useTranslation } from "../../lib/i18n/useTranslation";

const EXAMPLE_SEATS = 8;

export default function LandingPricingSection() {
  const { t } = useTranslation({ preferBrowser: true });
  const examplePrice = formatMonthlyPriceEur(EXAMPLE_SEATS);

  return (
    <div
      id="tarifs"
      className="flex flex-col overflow-hidden rounded-[22px] border border-[rgba(26,22,17,0.2)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(26,22,17,0.1)]"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(26,22,17,0.12)] px-[30px] py-[26px]">
        <div>
          <p className="ui-display text-[23px] text-[var(--ink)]">Un seul prix</p>
          <p className="mt-1 text-[13.5px] text-[rgba(26,22,17,0.55)]">
            11 modules · IA · Outlook · Slack/Teams · essai {TRIAL_DAYS} j sans CB
          </p>
        </div>
        <span className="ui-display text-[34px] text-[var(--accent)]">
          {PRICE_PER_SEAT_EUR} €
          <span className="text-[15px] text-[rgba(26,22,17,0.5)]">/utilisateur/mois</span>
        </span>
      </div>

      <div className="relative bg-[var(--ink)] px-[30px] py-[30px]">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="ui-display text-[23px] text-[var(--background)]">
              Plancher {MONTHLY_FLOOR_EUR} €/mois
            </p>
            <p className="mt-1 text-[13.5px] text-[rgba(246,241,231,0.55)]">
              Jusqu&apos;à {FLOOR_INCLUDED_SEATS} collaborateurs inclus
            </p>
          </div>
          <span className="ui-display text-[34px] text-[var(--background)]">
            {MONTHLY_FLOOR_EUR} €
            <span className="text-[15px] text-[rgba(246,241,231,0.5)]">/mois min.</span>
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(26,22,17,0.12)] px-[30px] py-[26px]">
        <div>
          <p className="ui-display text-[23px] text-[var(--ink)]">Au-delà</p>
          <p className="mt-1 text-[13.5px] text-[rgba(26,22,17,0.55)]">
            {PRICE_PER_SEAT_EUR} € × nombre d&apos;utilisateurs
          </p>
        </div>
        <span className="ui-display text-[34px] text-[var(--ink)]">
          {examplePrice.replace(/\s/g, "\u00a0")}
          <span className="text-[15px] text-[rgba(26,22,17,0.5)]">
            /mois pour {EXAMPLE_SEATS} pers.
          </span>
        </span>
      </div>

      <Link
        href="/pricing"
        className="flex items-center justify-center gap-2.5 bg-[var(--surface-deep)] px-[18px] py-[18px] text-[15px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--background)]"
      >
        {t("marketingPricing.seeDetails")}{" "}
        <span className="font-[family-name:var(--font-mono)]">→</span>
      </Link>
    </div>
  );
}
