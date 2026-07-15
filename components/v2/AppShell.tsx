"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Settings2,
  X,
} from "lucide-react";
import { useBranding } from "../../lib/brandingContext";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { isModuleEnabled } from "../../lib/modules";
import { effectiveModulesForPlan } from "../../lib/billing/plans";
import { useBillingPlan } from "../../lib/billing/useBillingPlan";
import { isNavActive, NAV_ITEMS } from "../../lib/navigation";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { useGamificationOptional } from "../../lib/gamification/gamificationContext";
import { AppMark, AppWordmark, BrandHeading } from "../AppBrand";
import GamificationHub from "../gamification/GamificationHub";

type V2AppShellProps = {
  children: ReactNode;
  toolbarRight?: ReactNode;
  searchSlot?: ReactNode;
  currentUserName?: string;
  currentUserEmail?: string;
  currentUserAvatarUrl?: string | null;
  currentUserJobTitle?: string | null;
};

const settingsNavItem = {
  href: "/settings",
  labelKey: "nav.settings",
  icon: Settings2,
  moduleId: null,
} as const;

function UserCard({
  name,
  email,
  avatarUrl,
  jobTitle,
  onOpenGamification,
  gamificationLinkLabel,
}: {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  onOpenGamification?: () => void;
  gamificationLinkLabel?: string;
}) {
  const label = name?.trim();
  if (!label && !email) return null;

  const initialsSource = label || email || "?";
  const initials =
    initialsSource
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2">
      <div className="flex items-center gap-2.5">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--accent)]">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={label ?? ""} fill sizes="32px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-[13px] font-bold text-white">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {label ? (
            <p className="truncate text-[13px] font-semibold leading-tight text-[var(--foreground)]">
              {label}
            </p>
          ) : null}
          {jobTitle ? (
            <p className="truncate text-[11.5px] leading-tight text-[var(--ink-muted)]">{jobTitle}</p>
          ) : null}
          {onOpenGamification ? (
            <button
              type="button"
              onClick={onOpenGamification}
              className="mt-1 text-[10px] font-semibold text-[var(--accent)] hover:underline"
            >
              {gamificationLinkLabel ?? "Parcours & badges"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function V2AppShell({
  children,
  toolbarRight,
  searchSlot,
  currentUserName,
  currentUserEmail,
  currentUserAvatarUrl,
  currentUserJobTitle,
}: V2AppShellProps) {
  const pathname = usePathname();
  const { branding } = useBranding();
  const { t } = useTranslation();
  const { plan } = useBillingPlan();
  const { user, loading: userLoading } = useCurrentUser();
  const gamification = useGamificationOptional();
  const displayName =
    currentUserName?.trim() ||
    user?.teamMemberName?.trim() ||
    user?.displayName?.trim() ||
    undefined;
  const displayEmail = currentUserEmail ?? user?.email;
  const displayAvatar = currentUserAvatarUrl ?? user?.avatarUrl;
  const displayJob = currentUserJobTitle ?? user?.jobTitle;
  const isAdmin = Boolean(user?.isAdmin);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const allowedModules = effectiveModulesForPlan(plan, branding.enabledModules);

  const items = [
    ...NAV_ITEMS.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      if (!item.moduleId) return true;
      return isModuleEnabled(allowedModules, item.moduleId);
    }),
    settingsNavItem,
  ];

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileNavOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  const isGuest = !userLoading && !displayName && !displayEmail;

  const navLinkClass = (active: boolean) =>
    [
      "ui-nav-link ui-transition flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm",
      active ? "ui-nav-link--active font-semibold" : "font-medium text-[rgba(26,22,17,0.6)]",
    ]
      .filter(Boolean)
      .join(" ");

  const sidebarContent = (onNavClick?: () => void) => (
    <>
      <div className="flex items-center gap-3">
        <AppMark className="h-9 w-9" />
        <AppWordmark size="sidebar" />
      </div>
      <nav className="mt-[34px] min-h-0 flex-1 space-y-px overflow-y-auto overscroll-contain">
        {items.map((item, index) => {
          const active = isNavActive(item.href, pathname);
          const num = String(index + 1).padStart(2, "0");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={navLinkClass(active)}
            >
              <span
                className={[
                  "w-[18px] font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.05em]",
                  active ? "text-[var(--accent)]" : "text-[rgba(26,22,17,0.35)]",
                ].join(" ")}
              >
                {num}
              </span>
              <span>{t(item.labelKey)}</span>
              {active ? (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
        {userLoading ? (
          <div className="h-[52px] animate-pulse rounded-xl bg-[var(--surface-soft)]" aria-hidden />
        ) : isGuest ? (
          <Link href="/login" className="ui-btn ui-btn-primary w-full text-xs" onClick={onNavClick}>
            Se connecter
          </Link>
        ) : (
          <UserCard
            name={displayName}
            email={displayEmail}
            avatarUrl={displayAvatar}
            jobTitle={displayJob}
            onOpenGamification={gamification?.openPanel}
            gamificationLinkLabel={t("gamification.panel.shortTitle") + " & " + t("gamification.panel.badges").toLowerCase()}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-5 lg:px-8">
        <aside
          className="fixed bottom-5 left-4 top-5 hidden w-64 flex-col border-r border-[var(--line)] bg-[var(--background)] py-7 pr-[18px] lg:flex"
          style={{ zIndex: "var(--z-sidebar)" }}
        >
          {sidebarContent()}
        </aside>

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              aria-label="Fermer le menu"
              className="fixed inset-0 bg-[var(--foreground)]/20 lg:hidden"
              style={{ zIndex: "var(--z-overlay)" }}
              onClick={() => setMobileNavOpen(false)}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation principale"
              className="ui-surface fixed inset-y-0 left-0 flex w-72 max-w-[88vw] flex-col p-5 lg:hidden"
              style={{ zIndex: "calc(var(--z-overlay) + 1)" }}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <BrandHeading />
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="ui-btn ui-btn-ghost h-9 w-9 p-0"
                  aria-label="Fermer le menu"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">{sidebarContent(() => setMobileNavOpen(false))}</div>
            </aside>
          </>
        ) : null}

        <div className="min-w-0 lg:pl-[268px]">
          <header className="mb-6 flex flex-wrap items-center gap-4 border-b border-[var(--line)] px-0 py-5">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="ui-btn ui-btn-secondary h-10 w-10 rounded-[10px] p-0 lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>

            <div className="min-w-[180px] flex-1 max-w-[420px]">
              {searchSlot ?? (
                <div className="flex min-w-[240px] items-center gap-2 rounded-[100px] border border-[rgba(26,22,17,0.18)] bg-[var(--surface)] px-4 py-2.5">
                  <span className="text-sm text-[rgba(26,22,17,0.45)]" aria-hidden>
                    ⌕
                  </span>
                  <input
                    type="text"
                    placeholder="Rechercher…"
                    aria-label="Recherche globale"
                    className="ui-focus-ring w-full bg-transparent text-[13.5px] text-[var(--foreground)] placeholder:text-[rgba(26,22,17,0.4)] focus:outline-none"
                  />
                  <kbd className="ml-auto font-[family-name:var(--font-mono)] text-[10px] rounded border border-[rgba(26,22,17,0.2)] px-1.5 py-px text-[rgba(26,22,17,0.45)]">
                    ⌘K
                  </kbd>
                </div>
              )}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2.5">
              <GamificationHub />
              {toolbarRight}
            </div>
          </header>

          <main className="pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
