"use client";

import { useMemo } from "react";
import { format, isSameISOWeek } from "date-fns";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { CalendarRange, Layers, Tag, Users } from "lucide-react";
import type { Task } from "../../../lib/types";
import AdminAvatar from "../../AdminAvatar";
import EmptyState from "../../ui/EmptyState";
import {
  barPositionPercent,
  buildGanttBars,
  buildGanttGroups,
  buildWeekColumns,
  collectLegendItems,
  todayPositionPercent,
  type RetroplanningGroupBy,
} from "../../../lib/v2/retroplanning";

type RetroplanningGanttProps = {
  tasks: Task[];
  rangeStart: Date;
  rangeEnd: Date;
  groupBy: RetroplanningGroupBy;
  title?: string;
};

const GROUP_OPTION_IDS: { id: RetroplanningGroupBy; labelKey: string; icon: typeof Users }[] = [
  { id: "tasks", labelKey: "planning.gantt.group.tasks", icon: CalendarRange },
  { id: "person", labelKey: "planning.gantt.group.person", icon: Users },
  { id: "domain", labelKey: "planning.gantt.group.domain", icon: Layers },
  { id: "mode", labelKey: "planning.gantt.group.mode", icon: Tag },
];

export function RetroplanningGroupToggle({
  value,
  onChange,
}: {
  value: RetroplanningGroupBy;
  onChange: (v: RetroplanningGroupBy) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-1">
      {GROUP_OPTION_IDS.map(({ id, labelKey, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={[
            "ui-transition inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
            value === id
              ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm"
              : "text-[color:var(--foreground)]/60 hover:bg-[var(--surface)]",
          ].join(" ")}
        >
          <Icon className="h-3.5 w-3.5" />
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}

export default function RetroplanningGantt({
  tasks,
  rangeStart,
  rangeEnd,
  groupBy,
  title,
}: RetroplanningGanttProps) {
  const { t, locale } = useTranslation();
  const dateLocale = useMemo(() => getDateFnsLocale(locale), [locale]);
  const displayTitle = title ?? t("planning.gantt.defaultTitle");

  const bars = useMemo(() => buildGanttBars(tasks, groupBy), [tasks, groupBy]);
  const groups = useMemo(() => buildGanttGroups(bars, groupBy), [bars, groupBy]);
  const weeks = useMemo(() => buildWeekColumns(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const legend = useMemo(() => collectLegendItems(bars), [bars]);
  const todayPct = useMemo(
    () => todayPositionPercent(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );
  const now = new Date();

  if (bars.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title={t("emptyStates.planning.title")}
        description={t("emptyStates.planning.body")}
        actionLabel={t("emptyStates.planning.cta")}
        actionHref="/dashboard/kanban"
      />
    );
  }

  return (
    <section className="ui-surface overflow-hidden rounded-2xl border border-[var(--line)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">{displayTitle}</h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {format(rangeStart, "d MMM", { locale: dateLocale })} → {format(rangeEnd, "d MMM yyyy", { locale: dateLocale })}
          </p>
        </div>
        {legend.length > 0 ? (
          <div className="flex max-w-xl flex-wrap gap-2">
            {legend.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold text-[var(--foreground)]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="sticky top-0 z-20 flex border-b border-[var(--line)] bg-[var(--surface)]">
            <div className="sticky left-0 z-30 w-[260px] shrink-0 border-r border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                {t("planning.gantt.columnHeader")}
              </span>
            </div>
            <div className="relative flex flex-1">
              {weeks.map((week, idx) => {
                const isCurrent = isSameISOWeek(now, week.weekStart);
                return (
                  <div
                    key={week.weekStart.toISOString()}
                    className={[
                      "flex-1 border-r border-[var(--line)] px-1 py-3 text-center",
                      idx % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface-soft)]/60",
                      isCurrent ? "bg-[var(--accent-soft)]/40" : "",
                    ].join(" ")}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                      {week.label}
                    </p>
                    <p className="text-[9px] text-[var(--ink-muted)]">
                      {format(week.weekStart, "d MMM", { locale: dateLocale })}
                    </p>
                  </div>
                );
              })}
              {todayPct != null ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[var(--foreground)]"
                  style={{ left: `${todayPct}%` }}
                  title={t("planning.gantt.today")}
                />
              ) : null}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.id}>
              {groups.length > 1 || groupBy !== "tasks" ? (
                <div className="flex border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_4%,var(--surface-soft))]">
                  <div className="sticky left-0 z-10 flex w-[260px] shrink-0 items-center gap-2 border-r border-[var(--line)] px-4 py-2.5">
                    {group.accentColor ? (
                      <span
                        className="h-3 w-1 rounded-full"
                        style={{ backgroundColor: group.accentColor }}
                      />
                    ) : null}
                    {groupBy === "person" && group.id !== "Non assigné" ? (
                      <AdminAvatar admin={group.label} size="sm" />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{group.label}</p>
                      {group.subtitle ? (
                        <p className="text-[10px] text-[var(--ink-muted)]">{group.subtitle}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex-1" />
                </div>
              ) : null}

              {group.bars.map((bar) => {
                const pos = barPositionPercent(bar.start, bar.end, rangeStart, rangeEnd);
                const personLabel =
                  groupBy === "person" ? bar.rowKey.split("::")[0] : bar.assignees[0];

                return (
                  <div
                    key={bar.rowKey}
                    className="group flex border-b border-[var(--line)]/70 hover:bg-[var(--surface-soft)]/50"
                  >
                    <div className="sticky left-0 z-10 w-[260px] shrink-0 border-r border-[var(--line)] bg-[var(--surface)] px-4 py-3 group-hover:bg-[var(--surface-soft)]">
                      <div className="flex items-start gap-2">
                        {groupBy !== "person" && personLabel ? (
                          <AdminAvatar admin={personLabel} size="sm" />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">{bar.label}</p>
                          <p className="mt-0.5 truncate text-[10px] text-[var(--ink-muted)]">
                            {bar.categoryLabel}
                            {bar.task.eventName ? ` · ${bar.task.eventName}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex flex-1 items-center py-2.5">
                      <div className="absolute inset-0 flex">
                        {weeks.map((week, idx) => (
                          <div
                            key={week.weekStart.toISOString()}
                            className={[
                              "flex-1 border-r border-dashed border-[var(--line)]/60",
                              idx % 2 === 0 ? "" : "bg-[var(--surface-soft)]/30",
                            ].join(" ")}
                          />
                        ))}
                      </div>

                      {todayPct != null ? (
                        <div
                          className="pointer-events-none absolute inset-y-1 z-10 w-px bg-[var(--foreground)]/70"
                          style={{ left: `${todayPct}%` }}
                        />
                      ) : null}

                      {pos.width > 0 ? (
                        <div
                          className="absolute top-1/2 z-[5] h-8 -translate-y-1/2 rounded-lg px-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform group-hover:scale-[1.02]"
                          style={{
                            left: `${pos.left}%`,
                            width: `${pos.width}%`,
                            background: `linear-gradient(135deg, ${bar.color}, color-mix(in srgb, ${bar.color} 75%, black))`,
                            minWidth: "2.5rem",
                          }}
                          title={`${format(bar.start, "d MMM", { locale: dateLocale })} → ${format(bar.end, "d MMM yyyy", { locale: dateLocale })}`}
                        >
                          <div className="flex h-full items-center">
                            <span className="truncate text-[10px] font-semibold text-white drop-shadow-sm">
                              {format(bar.start, "d/MM", { locale: dateLocale })}–{format(bar.end, "d/MM", { locale: dateLocale })}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--line)] bg-[var(--surface-soft)] px-5 py-2.5 text-center text-[10px] text-[var(--ink-muted)]">
        {t("planning.gantt.footer")}
      </div>
    </section>
  );
}
