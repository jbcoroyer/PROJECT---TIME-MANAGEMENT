"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ANNUAL_FLOOR_EUR,
  FLOOR_INCLUDED_SEATS,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_ANNUAL_EUR,
  PRICE_PER_SEAT_EUR,
  TRIAL_DAYS,
  formatAnnualMonthlyEquivalentEur,
  formatPriceEurForInterval,
  type BillingInterval,
} from "../../lib/billing/plans";
import BillingIntervalToggle from "../billing/BillingIntervalToggle";
import { useTranslation } from "../../lib/i18n/useTranslation";

const EXAMPLE_SEATS = 8;

export default function LandingPricingSection() {
  const { t } = useTranslation({ preferBrowser: true });
  const [interval, setInterval] = useState<BillingInterval>("month");
  const examplePrice = formatPriceEurForInterval(EXAMPLE_SEATS, interval);
  const seatPrice = interval === "year" ? PRICE_PER_SEAT_ANNUAL_EUR : PRICE_PER_SEAT_EUR;
  const floorPrice = interval === "year" ? ANNUAL_FLOOR_EUR : MONTHLY_FLOOR_EUR;
  const periodSuffix = interval === "year" ? t("settings.billing.perYearSuffix") : t("settings.billing.perMonthSuffix");

  return (
    <div className="flex flex-col overflow-hidden rounded-[22px] border border-[rgba(26,22,17,0.2)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(26,22,17,0.1)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(26,22,17,0.12)] px-[30px] py-4">
        <p className="text-[13px] text-[rgba(26,22,17,0.55)]">
          {t("pricing.modulesLine", { days: TRIAL_DAYS })}
        </p>
        <BillingIntervalToggle value={interval} onChange={setInterval} />
      </div>

      <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(26,22,17,0.12)] px-[30px] py-[26px]">
        <div>
          <p className="ui-display text-[23px] text-[var(--ink)]">{t("pricing.singlePriceTitle")}</p>
          {interval === "year" && (
            <p className="mt-1 text-[12px] font-semibold text-[var(--accent)]">{t("pricing.annualCommitment")}</p>
          )}
        </div>
        <span className="ui-display text-[34px] text-[var(--accent)]">
          {seatPrice} €
          <span className="text-[15px] text-[rgba(26,22,17,0.5)]">
            {interval === "year"
              ? t("marketingPricing.page.perUserYear")
              : t("marketingPricing.page.perUserMonth")}
          </span>
        </span>
      </div>

      <div className="relative bg-[var(--ink)] px-[30px] py-[30px]">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="ui-display text-[23px] text-[var(--background)]">
              {interval === "year"
                ? t("pricing.floorAnnual", { floor: floorPrice })
                : t("pricing.floorMonthly", { floor: floorPrice })}
            </p>
            <p className="mt-1 text-[13.5px] text-[rgba(246,241,231,0.55)]">
              {t("pricing.floorIncluded", { seats: FLOOR_INCLUDED_SEATS })}
            </p>
          </div>
          <span className="ui-display text-[34px] text-[var(--background)]">
            {floorPrice} €
            <span className="text-[15px] text-[rgba(246,241,231,0.5)]">{periodSuffix}</span>
          </span>
        </div>
        {interval === "year" && (
          <p className="mt-3 text-[12px] text-[rgba(246,241,231,0.55)]">
            {t("pricing.annualEquivalent", {
              price: formatAnnualMonthlyEquivalentEur(FLOOR_INCLUDED_SEATS),
            })}
          </p>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(26,22,17,0.12)] px-[30px] py-[26px]">
        <div>
          <p className="ui-display text-[23px] text-[var(--ink)]">{t("pricing.beyond")}</p>
          <p className="mt-1 text-[13.5px] text-[rgba(26,22,17,0.55)]">
            {t("pricing.perSeatFormula", { price: seatPrice })}
          </p>
        </div>
        <span className="ui-display text-[34px] text-[var(--ink)]">
          {examplePrice.replace(/\s/g, "\u00a0")}
          <span className="text-[15px] text-[rgba(26,22,17,0.5)]">
            {interval === "year"
              ? t("pricing.perYearForSeats", { seats: EXAMPLE_SEATS })
              : t("pricing.perMonthForSeats", { seats: EXAMPLE_SEATS })}
          </span>
        </span>
      </div>

      <Link
        href="/pricing"
        className="flex items-center justify-center gap-2.5 bg-[var(--surface-deep)] px-[18px] py-[18px] text-[15px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--background)]"
      >
        {t("pricing.seeDetails")}{" "}
        <span className="font-[family-name:var(--font-mono)]">→</span>
      </Link>
    </div>
  );
}
