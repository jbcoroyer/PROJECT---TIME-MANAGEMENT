"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Layers, SlidersHorizontal, Users } from "lucide-react";
import AdminSettingsPanel from "../../settings/AdminSettingsPanel";
import ModulesSettingsSection from "../../settings/ModulesSettingsSection";
import TeamSettingsSection from "../../settings/TeamSettingsSection";
import UpgradeProBanner from "../../settings/UpgradeProBanner";
import GdprDataSection from "../../settings/GdprDataSection";
import PlatformAdminShortcut from "../../platform/PlatformAdminShortcut";
import SignOutSection from "../../settings/SignOutSection";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { useCurrentUser } from "../../../lib/useCurrentUser";

type SettingsTab = "team" | "modules" | "organisation";

const ALL_TABS: {
  id: SettingsTab;
  icon: typeof Layers;
  labelKey: string;
  adminOnly?: boolean;
}[] = [
  { id: "team", icon: Users, labelKey: "settings.tabs.team", adminOnly: true },
  { id: "modules", icon: Layers, labelKey: "settings.tabs.modules" },
  { id: "organisation", icon: SlidersHorizontal, labelKey: "settings.tabs.organisation", adminOnly: true },
];

const SECTION_ANCHORS: Record<string, string> = {
  team: "settings-team",
  modules: "settings-modules",
  outlook: "settings-outlook",
};

function tabForSection(section: string | null, isAdmin: boolean): SettingsTab {
  if (section === "outlook") return "organisation";
  if (section === "team") return "team";
  if (section === "modules") return "modules";
  return isAdmin ? "team" : "modules";
}

function V2SettingsPageContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);
  const sectionTab = section ? tabForSection(section, isAdmin) : null;
  const defaultTab: SettingsTab = isAdmin ? "team" : "modules";
  const [manualTab, setManualTab] = useState<SettingsTab | null>(null);
  const tab = sectionTab ?? manualTab ?? defaultTab;

  const tabs = useMemo(() => ALL_TABS.filter((item) => !item.adminOnly || isAdmin), [isAdmin]);
  const activeTab = tabs.some((item) => item.id === tab) ? tab : defaultTab;

  useEffect(() => {
    if (!section) return;
    const anchorId = SECTION_ANCHORS[section];
    if (!anchorId) return;

    const scrollToAnchor = () => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const timer = window.setTimeout(scrollToAnchor, section === "outlook" || section === "modules" ? 120 : 0);
    return () => window.clearTimeout(timer);
  }, [section, activeTab]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="ui-surface rounded-2xl px-5 py-6 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--foreground)]/45">
          {t("settings.pageKicker")}
        </p>
        <h1 className="ui-display mt-1 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
          {t("settings.pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--foreground)]/60">
          {t("settings.pageSubtitle")}
        </p>
      </header>

      <Suspense fallback={null}>
        <UpgradeProBanner />
      </Suspense>

      <PlatformAdminShortcut />

      <nav className="flex flex-wrap gap-2" aria-label={t("settings.tabsLabel")}>
        {tabs.map(({ id, icon: Icon, labelKey }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setManualTab(id);
              }}
              className={[
                "ui-transition inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold",
                active
                  ? "border-[color:var(--brand-primary)]/30 bg-[color:var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:border-[var(--line-strong)] hover:bg-[var(--surface-soft)]",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </button>
          );
        })}
      </nav>

      {activeTab === "team" && isAdmin ? <TeamSettingsSection /> : null}
      {activeTab === "modules" ? <ModulesSettingsSection /> : null}
      {activeTab === "organisation" && isAdmin ? (
        <section>
          <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)]/50 px-4 py-3">
            <p className="text-sm text-[color:var(--foreground)]/65">{t("settings.organisationIntro")}</p>
          </div>
          <AdminSettingsPanel />
        </section>
      ) : null}

      <GdprDataSection />
      <SignOutSection />
    </div>
  );
}

export default function V2SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl py-12 text-center text-sm text-[color:var(--foreground)]/50">
          …
        </div>
      }
    >
      <V2SettingsPageContent />
    </Suspense>
  );
}
