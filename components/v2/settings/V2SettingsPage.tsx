"use client";

import { useState } from "react";
import { Bot, Layers, SlidersHorizontal } from "lucide-react";
import AutomationsManager from "./AutomationsManager";
import AdminSettingsPanel from "../../settings/AdminSettingsPanel";
import ModulesSettingsSection from "../../settings/ModulesSettingsSection";
import { useReferenceData } from "../../../lib/useReferenceData";
import { useTranslation } from "../../../lib/i18n/useTranslation";

type SettingsTab = "modules" | "automations" | "admin";

const TABS: { id: SettingsTab; icon: typeof Layers; labelKey: string }[] = [
  { id: "modules", icon: Layers, labelKey: "settings.tabs.modules" },
  { id: "automations", icon: Bot, labelKey: "settings.tabs.automations" },
  { id: "admin", icon: SlidersHorizontal, labelKey: "settings.tabs.admin" },
];

export default function V2SettingsPage() {
  const { admins, columns, domains } = useReferenceData();
  const { t } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>("modules");

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

      <nav
        className="flex flex-wrap gap-2"
        aria-label={t("settings.tabsLabel")}
      >
        {TABS.map(({ id, icon: Icon, labelKey }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
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

      {tab === "modules" ? <ModulesSettingsSection /> : null}

      {tab === "automations" ? (
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

      {tab === "admin" ? (
        <section>
          <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)]/50 px-4 py-3">
            <p className="text-sm text-[color:var(--foreground)]/65">{t("settings.adminIntro")}</p>
          </div>
          <AdminSettingsPanel />
        </section>
      ) : null}
    </div>
  );
}
