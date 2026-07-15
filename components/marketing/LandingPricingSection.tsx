"use client";

import Link from "next/link";
import { PUBLIC_PLAN_MARKETING } from "../../lib/billing/plans";

export default function LandingPricingSection() {
  const free = PUBLIC_PLAN_MARKETING.free;
  const starter = PUBLIC_PLAN_MARKETING.starter;
  const pro = PUBLIC_PLAN_MARKETING.pro;

  return (
    <div
      id="tarifs"
      className="flex flex-col overflow-hidden rounded-[22px] border border-[rgba(26,22,17,0.2)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(26,22,17,0.1)]"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(26,22,17,0.12)] px-[30px] py-[26px]">
        <div>
          <p className="ui-display text-[23px] text-[var(--ink)]">{free.name}</p>
          <p className="mt-1 text-[13.5px] text-[rgba(26,22,17,0.55)]">1 à 2 personnes, modules essentiels</p>
        </div>
        <span className="ui-display text-[34px] text-[var(--ink)]">{free.price}</span>
      </div>

      <div className="relative bg-[var(--ink)] px-[30px] py-[30px]">
        <span className="absolute right-[30px] top-[18px] font-[family-name:var(--font-mono)] text-[10.5px] uppercase tracking-[0.16em] text-[var(--accent-on-dark)]">
          ✦ POPULAIRE
        </span>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="ui-display text-[23px] text-[var(--background)]">{starter.name}</p>
            <p className="mt-1 text-[13.5px] text-[rgba(246,241,231,0.55)]">Jusqu&apos;à 10 personnes, tous les modules</p>
          </div>
          <span className="ui-display text-[34px] text-[var(--background)]">
            {starter.price}
            <span className="text-[15px] text-[rgba(246,241,231,0.5)]">{starter.priceSuffix}</span>
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(26,22,17,0.12)] px-[30px] py-[26px]">
        <div>
          <p className="ui-display text-[23px] text-[var(--ink)]">{pro.name}</p>
          <p className="mt-1 text-[13.5px] text-[rgba(26,22,17,0.55)]">Équipes illimitées + assistant IA</p>
        </div>
        <span className="ui-display text-[34px] text-[var(--ink)]">
          {pro.price}
          <span className="text-[15px] text-[rgba(26,22,17,0.5)]">{pro.priceSuffix}</span>
        </span>
      </div>

      <Link
        href="/pricing"
        className="flex items-center justify-center gap-2.5 bg-[var(--surface-deep)] px-[18px] py-[18px] text-[15px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--background)]"
      >
        Voir le détail des tarifs <span className="font-[family-name:var(--font-mono)]">→</span>
      </Link>
    </div>
  );
}
