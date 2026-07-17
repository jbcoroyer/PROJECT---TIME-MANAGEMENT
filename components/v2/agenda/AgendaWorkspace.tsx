"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Clock,
  Inbox,
  Link2,
  Sparkles,
  Sun,
} from "lucide-react";
import type { AgendaAppointment, AgendaSettings } from "../../../lib/agenda/agendaTypes";
import type { AgendaStats } from "../../../app/actions/agenda";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import AgendaBookingPanel from "./AgendaBookingPanel";
import AgendaCalendarView from "./AgendaCalendarView";
import AgendaRequestsPanel from "./AgendaRequestsPanel";
import AppointmentDetailPanel from "./AppointmentDetailPanel";
import AppointmentFormModal from "./AppointmentFormModal";
import V2TodoPage from "../todo/V2TodoPage";

type TabId = "calendar" | "booking" | "requests" | "today";

type AgendaWorkspaceProps = {
  settings: AgendaSettings;
  stats: AgendaStats;
};

export default function AgendaWorkspace({ settings, stats }: AgendaWorkspaceProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId =
    tabParam === "booking" || tabParam === "requests" || tabParam === "today" || tabParam === "calendar"
      ? tabParam
      : "calendar";

  const [selected, setSelected] = useState<AgendaAppointment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaAppointment | null>(null);
  const [slotStart, setSlotStart] = useState<Date | undefined>();
  const [slotEnd, setSlotEnd] = useState<Date | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = useMemo(
    () =>
      [
        { id: "calendar" as const, label: t("agenda.workspace.tabs.calendar"), icon: CalendarRange },
        { id: "requests" as const, label: t("agenda.workspace.tabs.requests"), icon: Inbox },
        { id: "booking" as const, label: t("agenda.workspace.tabs.booking"), icon: Link2 },
        { id: "today" as const, label: t("agenda.workspace.tabs.today"), icon: Sun },
      ],
    [t],
  );

  const setTab = useCallback(
    (tab: TabId) => {
      router.replace(tab === "calendar" ? "/agenda" : `/agenda?tab=${tab}`);
    },
    [router],
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    router.refresh();
  }, [router]);

  const statCards = useMemo(
    () => [
      { label: t("agenda.workspace.stats.today"), value: stats.todayCount, icon: Sun },
      { label: t("agenda.workspace.stats.upcoming"), value: stats.upcomingCount, icon: CalendarDays },
      { label: t("agenda.workspace.stats.pending"), value: stats.pendingCount, icon: Clock },
    ],
    [stats, t],
  );

  return (
    <div className="space-y-5">
      <header className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-5">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          <CalendarDays className="h-3.5 w-3.5" /> {t("agenda.workspace.badge")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{t("agenda.workspace.title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">{t("agenda.workspace.subtitle")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3"
            >
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              "ui-btn gap-2 text-sm",
              activeTab === id ? "ui-btn-primary" : "ui-btn-secondary",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "calendar" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div key={refreshKey}>
            <AgendaCalendarView
              onSelectAppointment={(appt) => setSelected(appt)}
              onCreateSlot={(start, end) => {
                setEditing(null);
                setSlotStart(start);
                setSlotEnd(end);
                setFormOpen(true);
              }}
            />
          </div>
          <AppointmentDetailPanel
            appointment={selected}
            onClose={() => setSelected(null)}
            onUpdated={handleRefresh}
            onEdit={(appt) => {
              setEditing(appt);
              setFormOpen(true);
            }}
          />
        </div>
      ) : null}

      {activeTab === "booking" ? (
        <AgendaBookingPanel settings={settings} onUpdated={handleRefresh} />
      ) : null}

      {activeTab === "requests" ? (
        <AgendaRequestsPanel onUpdated={handleRefresh} />
      ) : null}

      {activeTab === "today" ? (
        <div className="space-y-4">
          <div className="ui-surface flex items-start gap-3 rounded-2xl p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
            <p className="text-sm text-[var(--ink-muted)]">{t("agenda.workspace.todayTab.description")}</p>
          </div>
          <V2TodoPage />
        </div>
      ) : null}

      <AppointmentFormModal
        open={formOpen}
        initialStart={slotStart}
        initialEnd={slotEnd}
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={handleRefresh}
      />
    </div>
  );
}
