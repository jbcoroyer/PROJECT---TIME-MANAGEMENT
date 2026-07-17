"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import {
  ANNUAL_FLOOR_EUR,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_ANNUAL_EUR,
  PRICE_PER_SEAT_EUR,
  TRIAL_DAYS,
} from "../../lib/billing/plans";
import { useBillingPlan } from "../../lib/billing/useBillingPlan";
import { useTranslation } from "../../lib/i18n/useTranslation";

type SidebarBillingVignetteProps = {
  onNavigate?: () => void;
};

export default function SidebarBillingVignette({ onNavigate }: SidebarBillingVignetteProps) {
  const { t } = useTranslation();
  const {
    plan,
    trialDaysLeft,
    accessAllowed,
    isAdmin,
    loading,
    hasActiveSubscription,
    memberCount,
  } = useBillingPlan();

  if (loading) {
    return (
      <div
        className="ui-sidebar-billing h-[108px] animate-pulse rounded-2xl bg-[rgba(246,241,231,0.06)]"
        aria-hidden
      />
    );
  }

  const billingHref = "/settings?section=billing";
  const onTrial = plan === "trial";
  const onActive = plan === "active" && (hasActiveSubscription || accessAllowed);
  const days =
    trialDaysLeft === null || trialDaysLeft === undefined ? TRIAL_DAYS : Math.max(0, trialDaysLeft);
  const urgentTrial = onTrial && days <= 3;
  const expired = onTrial && days <= 0;
  const needsPay = expired || plan === "canceled" || !accessAllowed;
  const trialProgress = Math.min(100, Math.max(4, Math.round((days / TRIAL_DAYS) * 100)));

  if (onActive && !needsPay) {
    return (
      <Link
        href={billingHref}
        onClick={onNavigate}
        className="ui-sidebar-billing ui-sidebar-billing--active group block rounded-2xl p-3.5"
      >
        <div className="flex items-start gap-3">
          <span className="ui-sidebar-billing__icon ui-sidebar-billing__icon--active flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ui-sidebar-billing__kicker font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em]">
              {t("nav.billing.activeKicker")}
            </p>
            <p className="ui-sidebar-billing__title mt-1 font-[family-name:var(--font-display)] text-[1.15rem] leading-none tracking-[-0.02em]">
              {t("nav.billing.activeTitle")}
            </p>
            <p className="ui-sidebar-billing__body mt-1.5 text-[11.5px] leading-snug">
              {t("nav.billing.activeBody", {
                count: memberCount,
                floor: MONTHLY_FLOOR_EUR,
                annualFloor: ANNUAL_FLOOR_EUR,
              })}
            </p>
            <span className="ui-sidebar-billing__link mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold">
              {t("nav.billing.ctaManage")}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  const title = needsPay
    ? t("nav.billing.expiredTitle")
    : urgentTrial
      ? t("nav.billing.urgentTitle", { days })
      : t("nav.billing.trialTitle", { days });

  const body = needsPay
    ? t("nav.billing.expiredBody", {
        floor: MONTHLY_FLOOR_EUR,
        annualFloor: ANNUAL_FLOOR_EUR,
        seat: PRICE_PER_SEAT_EUR,
        annualSeat: PRICE_PER_SEAT_ANNUAL_EUR,
      })
    : t("nav.billing.trialBody", {
        floor: MONTHLY_FLOOR_EUR,
        annualFloor: ANNUAL_FLOOR_EUR,
        seat: PRICE_PER_SEAT_EUR,
        annualSeat: PRICE_PER_SEAT_ANNUAL_EUR,
      });

  const cta = isAdmin
    ? needsPay
      ? t("nav.billing.ctaSubscribeNow")
      : t("nav.billing.ctaSubscribe")
    : t("nav.billing.ctaAskAdmin");

  return (
    <Link
      href={billingHref}
      onClick={onNavigate}
      className={[
        "ui-sidebar-billing group block overflow-hidden rounded-2xl p-3.5",
        needsPay || urgentTrial ? "ui-sidebar-billing--urgent" : "ui-sidebar-billing--trial",
      ].join(" ")}
    >
      <div className="ui-sidebar-billing__glow" aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="ui-sidebar-billing__kicker font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em]">
              {needsPay ? t("nav.billing.expiredKicker") : t("nav.billing.trialKicker")}
            </p>
            <p className="ui-sidebar-billing__title mt-1.5 font-[family-name:var(--font-display)] text-[1.2rem] leading-[1.05] tracking-[-0.02em]">
              {title}
            </p>
          </div>
          {!needsPay ? (
            <div className="ui-sidebar-billing__days shrink-0 text-right">
              <p className="font-[family-name:var(--font-display)] text-[1.65rem] leading-none tracking-[-0.03em] text-[var(--accent-on-dark)]">
                {days}
              </p>
              <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.12em] opacity-60">
                {t("nav.billing.daysLabel")}
              </p>
            </div>
          ) : (
            <span className="ui-sidebar-billing__icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>

        <p className="ui-sidebar-billing__body mt-2 text-[11.5px] leading-relaxed">{body}</p>

        {!needsPay ? (
          <div className="ui-sidebar-billing__meter mt-3" aria-hidden>
            <span style={{ width: `${trialProgress}%` }} />
          </div>
        ) : null}

        <span className="ui-sidebar-billing__cta mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold">
          {cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
