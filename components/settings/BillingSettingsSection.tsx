"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import {
  FLOOR_INCLUDED_SEATS,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_EUR,
  TRIAL_DAYS,
} from "../../lib/billing/plans";
import { useTranslation } from "../../lib/i18n/useTranslation";
import BillingCard from "./BillingCard";

export default function BillingSettingsSection() {
  const { t } = useTranslation();

  return (
    <section id="settings-billing" className="scroll-mt-24 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[var(--surface)] shadow-[0_18px_48px_rgba(20,17,13,0.08)]">
        <div className="border-b border-[color-mix(in_srgb,var(--accent)_20%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))]">
                <CreditCard className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--foreground)]/45">
                  {t("settings.billing.kicker")}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                  {t("settings.billingTitle")}
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/65">
                  {t("settings.billingSubtitle")}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-right">
              <p className="ui-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                {PRICE_PER_SEAT_EUR}&nbsp;€
              </p>
              <p className="text-xs font-medium text-[color:var(--foreground)]/55">
                {t("settings.billing.perSeatLabel")}
              </p>
              <p className="mt-1 text-xs text-[color:var(--foreground)]/50">
                {t("settings.billing.floorLabel", {
                  floor: MONTHLY_FLOOR_EUR,
                  seats: FLOOR_INCLUDED_SEATS,
                })}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-[color:var(--foreground)]/55">
            {t("settings.billing.trialHighlight", { days: TRIAL_DAYS })}
            {" · "}
            <Link href="/pricing" className="font-semibold text-[var(--brand-primary)] hover:underline">
              {t("settings.billing.seePublicPricing")}
            </Link>
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <BillingCard />
        </div>
      </div>
    </section>
  );
}
