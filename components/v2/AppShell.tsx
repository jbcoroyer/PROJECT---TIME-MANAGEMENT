"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings2, X } from "lucide-react";
import { useBranding } from "../../lib/brandingContext";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { isModuleEnabled } from "../../lib/modules";
import { isNavActive, NAV_ITEMS } from "../../lib/navigation";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { useGamificationOptional } from "../../lib/gamification/gamificationContext";
import { useModuleVisits } from "../../lib/useModuleVisits";
import { AppMark, AppWordmark } from "../AppBrand";
import ModuleDiscoveryBadge from "../onboarding/ModuleDiscoveryBadge";
import SidebarBillingVignette from "./SidebarBillingVignette";

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
    <div className="ui-sidebar-user-card rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2">
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
            <p className="ui-sidebar-user-name truncate text-[13px] font-semibold leading-tight text-[var(--foreground)]">
              {label}
            </p>
          ) : null}
          {jobTitle ? (
            <p className="ui-sidebar-user-meta truncate text-[11.5px] leading-tight text-[var(--ink-muted)]">
              {jobTitle}
            </p>
          ) : null}
          {onOpenGamification ? (
            <button
              type="button"
              onClick={onOpenGamification}
              className="ui-sidebar-user-link mt-1 text-[10px] font-semibold text-[var(--accent)] hover:underline"
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
  const { user, loading: userLoading } = useCurrentUser();
  const gamification = useGamificationOptional();
  const { showDiscoveryBadge } = useModuleVisits(user?.id);
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

  const allowedModules = branding.enabledModules;

  const moduleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!item.moduleId) return true;
    return isModuleEnabled(allowedModules, item.moduleId);
  });

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
      active ? "ui-nav-link--active font-semibold" : "font-medium",
    ]
      .filter(Boolean)
      .join(" ");

  const dashboardHref = "/dashboard";
  const settingsActive = isNavActive(settingsNavItem.href, pathname);
  const settingsLabel = t(settingsNavItem.labelKey);

  const brandBlock = (options?: { onClick?: () => void; className?: string }) => (
    <Link
      href={dashboardHref}
      onClick={options?.onClick}
      title={`Retour au tableau de bord — ${branding.appName}`}
      className={[
        "relative z-10 flex cursor-pointer items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40",
        options?.className ?? "",
      ].join(" ")}
      aria-label={`Retour au tableau de bord — ${branding.appName}`}
    >
      <AppMark className="h-9 w-9" starOnDark />
      <AppWordmark size="sidebar" onDark />
    </Link>
  );

  const settingsLink = (onNavClick?: () => void) => (
    <Link
      href={settingsNavItem.href}
      onClick={onNavClick}
      className={navLinkClass(settingsActive)}
    >
      <Settings2 className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <span>{settingsLabel}</span>
    </Link>
  );

  const sidebarContent = (options?: { onNavClick?: () => void; hideBrand?: boolean }) => (
    <>
      {!options?.hideBrand ? brandBlock({ onClick: options?.onNavClick }) : null}
      <nav
        className={[
          "min-h-0 flex-1 space-y-px overflow-y-auto overscroll-contain",
          options?.hideBrand ? "mt-0" : "mt-[34px]",
        ].join(" ")}
        aria-label="Modules"
      >
        {moduleItems.map((item, index) => {
          const active = isNavActive(item.href, pathname);
          const num = String(index + 1).padStart(2, "0");
          const unvisited = !active && showDiscoveryBadge(item.moduleId);
          const moduleLabel = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={options?.onNavClick}
              data-tutorial={item.moduleId ? `nav-${item.moduleId}` : undefined}
              className={navLinkClass(active)}
              aria-label={
                unvisited
                  ? t("nav.newModuleAria", { module: moduleLabel })
                  : undefined
              }
            >
              <span className="ui-nav-num w-[18px] font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.05em]">
                {num}
              </span>
              <span>{moduleLabel}</span>
              {unvisited ? (
                <ModuleDiscoveryBadge
                  label={t("nav.newModule")}
                  title={t("nav.newModuleHint", { module: moduleLabel })}
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 shrink-0 space-y-2 border-t border-[rgba(246,241,231,0.15)] pt-4">
        {!isGuest && !userLoading ? (
          <SidebarBillingVignette onNavigate={options?.onNavClick} />
        ) : null}
        {settingsLink(options?.onNavClick)}
        {userLoading ? (
          <div className="h-[52px] animate-pulse rounded-xl bg-[rgba(246,241,231,0.08)]" aria-hidden />
        ) : isGuest ? (
          <Link
            href="/login"
            className="ui-btn ui-btn-primary w-full text-xs"
            onClick={options?.onNavClick}
          >
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
    <div className="h-svh overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex h-full">
        <aside
          className="ui-sidebar-contrast hidden w-[280px] shrink-0 flex-col border-r py-7 pl-6 pr-5 md:flex md:h-full md:overflow-hidden"
        >
          <div className="ui-sidebar-contrast__grain" aria-hidden />
          <div className="ui-sidebar-contrast__glow -bottom-40 -right-24 h-64 w-64" aria-hidden />
          <div className="relative flex min-h-0 flex-1 flex-col">{sidebarContent()}</div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {mobileNavOpen ? (
            <>
              <button
                type="button"
                aria-label="Fermer le menu"
                className="fixed inset-0 bg-[var(--foreground)]/20 md:hidden"
                style={{ zIndex: "var(--z-overlay)" }}
                onClick={() => setMobileNavOpen(false)}
              />
              <aside
                role="dialog"
                aria-modal="true"
                aria-label="Navigation principale"
                className="ui-sidebar-contrast fixed inset-y-0 left-0 flex w-72 max-w-[88vw] flex-col border-r p-5 md:hidden"
                style={{ zIndex: "calc(var(--z-overlay) + 1)" }}
              >
                <div className="ui-sidebar-contrast__grain" aria-hidden />
                <div className="relative mb-4 flex items-start justify-between gap-2">
                  {brandBlock({ onClick: () => setMobileNavOpen(false) })}
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="ui-btn ui-btn-ghost h-9 w-9 p-0 text-[rgba(246,241,231,0.75)] hover:bg-[rgba(246,241,231,0.1)] hover:text-[var(--background)]"
                    aria-label="Fermer le menu"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="relative flex min-h-0 flex-1 flex-col">
                  {sidebarContent({ onNavClick: () => setMobileNavOpen(false), hideBrand: true })}
                </div>
              </aside>
            </>
          ) : null}

          <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col px-4 py-5 lg:px-8">
            <header className="mb-6 flex items-center gap-3 border-b border-[var(--line)] pb-5">
              <div className="min-w-0 flex-1">
                {searchSlot ?? (
                  <div className="flex max-w-xl items-center gap-2 rounded-[100px] border border-[rgba(26,22,17,0.18)] bg-[var(--surface)] px-4 py-2.5">
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
              <div className="flex shrink-0 items-center gap-2">
                <div className="md:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="ui-btn ui-btn-secondary inline-flex h-10 w-10 rounded-[10px] p-0"
                    aria-label="Ouvrir le menu"
                    aria-expanded={mobileNavOpen}
                  >
                    <Menu className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                {toolbarRight}
              </div>
            </header>

            <main className="pb-10">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
