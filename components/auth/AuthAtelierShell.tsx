"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AtelierMark } from "../AtelierMark";
import { AppWordmark } from "../AppBrand";
import { useBranding } from "../../lib/brandingContext";
import { MONTHLY_FLOOR_EUR, PRICE_PER_SEAT_EUR, TRIAL_DAYS } from "../../lib/billing/plans";
import "../marketing/marketing.css";

const PROOF_POINTS = [
  { num: "01", text: "Kanban, demandes clients, planning, events, social, stock…" },
  { num: "02", text: "IA, Outlook 365 et alertes Slack / Teams inclus" },
  {
    num: "03",
    text: `${PRICE_PER_SEAT_EUR} €/user/mois · min. ${MONTHLY_FLOOR_EUR} € · essai ${TRIAL_DAYS} j sans CB`,
  },
];

type AuthAtelierShellProps = {
  children: ReactNode;
  heading: ReactNode;
  subtitle?: ReactNode;
};

export default function AuthAtelierShell({ children, heading, subtitle }: AuthAtelierShellProps) {
  const { branding } = useBranding();

  return (
    <div className="auth-atelier">
      <aside className="auth-atelier__panel">
        <div className="auth-atelier__panel-grain" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-[300px] -right-[200px] h-[700px] w-[700px] rounded-full blur-[100px]"
          style={{
            background: "radial-gradient(circle, oklch(0.55 0.16 45 / 0.35), transparent 70%)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <AtelierMark className="h-9 w-9" starOnDark />
          <span className="app-wordmark ui-display text-[1.75rem] text-[var(--background)]">
            {branding.appName}
          </span>
        </div>

        <div className="relative">
          <span className="ui-kicker text-[12px] tracking-[0.18em] text-[var(--accent-on-dark)]">
            N°01 — Votre espace vous attend
          </span>
          <p className="ui-display mt-[26px] text-[clamp(2.2rem,3.6vw,3.4rem)] leading-[1.08] tracking-[-0.02em] text-[var(--background)]">
            Dix outils en moins.
            <br />
            <em className="text-[var(--accent-on-dark)] italic">Une équipe</em> en plus.
          </p>
          <div className="mt-10 flex flex-col border-t border-[rgba(246,241,231,0.15)]">
            {PROOF_POINTS.map((pt) => (
              <div
                key={pt.num}
                className="flex items-center gap-4 border-b border-[rgba(246,241,231,0.15)] py-[15px]"
              >
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--accent-on-dark)]">
                  {pt.num}
                </span>
                <span className="text-[15px] text-[rgba(246,241,231,0.75)]">{pt.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative m-0 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[rgba(246,241,231,0.4)]">
          © 2026 WorkSpace — Fait avec soin
        </p>
      </aside>

      <div className="auth-atelier__form-wrap">
        <div className="w-full max-w-[400px]">
          <h1 className="ui-display text-[38px] tracking-[-0.015em] text-[var(--ink)]">{heading}</h1>
          {subtitle ? (
            <p className="mt-2.5 text-[15px] text-[var(--ink-muted)]">{subtitle}</p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthTabLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  if (active) {
    return (
      <button type="button" className="auth-atelier__tab auth-atelier__tab--active">
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className="auth-atelier__tab">
      {children}
    </Link>
  );
}

export function AuthMobileBrand() {
  return (
    <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
      <AtelierMark className="h-9 w-9" />
      <AppWordmark size="compact" />
    </Link>
  );
}
