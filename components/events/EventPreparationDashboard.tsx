"use client";

import { AlertTriangle, CheckCircle2, ListTodo, PiggyBank } from "lucide-react";
import BudgetGauge from "./BudgetGauge";
import { computeEventPreparationStats } from "../../lib/eventPreparationStats";
import type { EventRow } from "../../lib/eventTypes";
import type { Task } from "../../lib/types";
import { formatCurrency } from "../../lib/stockUtils";
import { useTranslation } from "../../lib/i18n/useTranslation";

type Props = {
  event: EventRow;
  tasks: Task[];
  consumedTotal: number;
};

export default function EventPreparationDashboard(props: Props) {
  const { t } = useTranslation();
  const { event, tasks, consumedTotal } = props;
  const stats = computeEventPreparationStats(event.id, tasks);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="ui-surface rounded-[22px] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/50">
          {t("eventsLegacy.prep.progressTitle")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="shrink-0">
            <p className="text-4xl font-semibold leading-none text-[var(--foreground)]">{stats.progressPct}%</p>
            <p className="mt-2 text-sm text-[color:var(--foreground)]/55">
              {t("eventsLegacy.prep.tasksDone", { done: stats.doneTasks, total: stats.totalTasks })}
            </p>
          </div>
          <div className="h-3 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)] ring-1 ring-[var(--line)]">
            <div
              className="h-full rounded-full bg-[color:var(--foreground)]/30 transition-[width]"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2 text-[color:var(--foreground)]/70">
            <ListTodo className="h-4 w-4 shrink-0" />
            {stats.totalTasks === 0
              ? t("eventsLegacy.prep.noTasks")
              : t("eventsLegacy.prep.taskCount", { count: stats.totalTasks })}
          </li>
          {stats.overdueTasks > 0 ? (
            <li className="flex items-center gap-2 font-semibold text-[var(--danger)]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t("eventsLegacy.timeline.overdue", { count: stats.overdueTasks })}
            </li>
          ) : (
            <li className="flex items-center gap-2 text-[var(--success)]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t("eventsLegacy.prep.noOverdue")}
            </li>
          )}
          {stats.unscheduledOpen > 0 ? (
            <li className="text-[var(--warning)]">
              {t("eventsLegacy.prep.unscheduledOpen", { count: stats.unscheduledOpen })}
            </li>
          ) : null}
        </ul>
      </div>
      <div className="ui-surface rounded-[22px] p-5">
        <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/50">
          <PiggyBank className="h-3.5 w-3.5" />
          {t("eventsLegacy.prep.eventBudget")}
        </div>
        <BudgetGauge allocated={event.allocatedBudget} consumed={consumedTotal} />
        <p className="mt-3 text-xs text-[color:var(--foreground)]/55">
          {t("eventsLegacy.prep.allocatedCap")} {formatCurrency(event.allocatedBudget)}
        </p>
      </div>
    </div>
  );
}
