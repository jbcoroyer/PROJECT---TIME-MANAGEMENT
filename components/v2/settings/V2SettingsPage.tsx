"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Layers, SlidersHorizontal } from "lucide-react";
import AutomationsManager from "./AutomationsManager";
import AdminSettingsPanel from "../../settings/AdminSettingsPanel";
import ModulesSettingsSection from "../../settings/ModulesSettingsSection";
import TeamInviteSection from "../../settings/TeamInviteSection";
import UpgradeProBanner from "../../settings/UpgradeProBanner";
import GdprDataSection from "../../settings/GdprDataSection";
import PlatformAdminShortcut from "../../platform/PlatformAdminShortcut";
import SignOutSection from "../../settings/SignOutSection";
import { useReferenceData } from "../../../lib/useReferenceData";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { useCurrentUser } from "../../../lib/useCurrentUser";

type SettingsTab = "modules" | "automations" | "admin";

const ALL_TABS: { id: SettingsTab; icon: typeof Layers; labelKey: string; adminOnly?: boolean }[] = [
  { id: "modules", icon: Layers, labelKey: "settings.tabs.modules" },
  { id: "automations", icon: Bot, labelKey: "settings.tabs.automations" },
  { id: "admin", icon: SlidersHorizontal, labelKey: "settings.tabs.admin", adminOnly: true },
];

const SECTION_ANCHORS: Record<string, string> = {
  team: "settings-team-invite",
  modules: "settings-modules",
  outlook: "settings-outlook",
};

function tabForSection(section: string | null): SettingsTab {
  if (section === "outlook") return "admin";
  if (section === "modules") return "modules";
  return "modules";
}

function V2SettingsPageContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const { admins, columns, domains } = useReferenceData();
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);
  const sectionTab = section ? tabForSection(section) : null;
  const [manualTab, setManualTab] = useState<SettingsTab>("modules");
  const tab = sectionTab ?? manualTab;

  const tabs = useMemo(
    () => ALL_TABS.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin],
  );

  const activeTab = tabs.some((item) => item.id === tab) ? tab : "modules";

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

      {isAdmin ? <TeamInviteSection /> : null}

      <PlatformAdminShortcut />

      <nav
        className="flex flex-wrap gap-2"
        aria-label={t("settings.tabsLabel")}
      >
        {tabs.map(({ id, icon: Icon, labelKey }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setManualTab(id)}
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

      {activeTab === "modules" ? <ModulesSettingsSection /> : null}

      {activeTab === "automations" ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)]/50 px-4 py-3">
            <p className="text-sm text-[color:var(--foreground)]/65">{t("settings.automationsIntro")}</p>
          </div>
          <AutomationsManager
            columns={columns.map((c) => c.name)}
            domains={domains.map((d) => d.name)}
            admins={admins.map((a) => a.name)}
          />
        </section>
      ) : null}

      {activeTab === "admin" && isAdmin ? (
        <section>
          <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)]/50 px-4 py-3">
            <p className="text-sm text-[color:var(--foreground)]/65">{t("settings.adminIntro")}</p>
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
