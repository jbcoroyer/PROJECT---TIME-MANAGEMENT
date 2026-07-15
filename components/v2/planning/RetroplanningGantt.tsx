"use client";

import { useMemo } from "react";
import { format, isSameISOWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarRange, Layers, Tag, Users } from "lucide-react";
import type { Task } from "../../../lib/types";
import AdminAvatar from "../../AdminAvatar";
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

const GROUP_OPTIONS: { id: RetroplanningGroupBy; label: string; icon: typeof Users }[] = [
  { id: "tasks", label: "Tâches", icon: CalendarRange },
  { id: "person", label: "Par personne", icon: Users },
  { id: "domain", label: "Par domaine", icon: Layers },
  { id: "mode", label: "Par mode", icon: Tag },
];

export function RetroplanningGroupToggle({
  value,
  onChange,
}: {
  value: RetroplanningGroupBy;
  onChange: (v: RetroplanningGroupBy) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-1">
      {GROUP_OPTIONS.map(({ id, label, icon: Icon }) => (
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
          {label}
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
  title = "Rétroplanning détaillé",
}: RetroplanningGanttProps) {
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
      <section className="ui-surface rounded-2xl p-10 text-center">
        <CalendarRange className="mx-auto h-10 w-10 text-[var(--accent)]" />
        <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">Aucune tâche datée</h3>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Ajoutez des échéances ou des créneaux planifiés sur vos tâches pour alimenter le rétroplanning.
        </p>
      </section>
    );
  }

  return (
    <section className="ui-surface overflow-hidden rounded-2xl border border-[var(--line)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {format(rangeStart, "d MMM", { locale: fr })} → {format(rangeEnd, "d MMM yyyy", { locale: fr })}
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
          {/* En-tête semaines */}
          <div className="sticky top-0 z-20 flex border-b border-[var(--line)] bg-[var(--surface)]">
            <div className="sticky left-0 z-30 w-[260px] shrink-0 border-r border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Tâches
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
                      {format(week.weekStart, "d MMM", { locale: fr })}
                    </p>
                  </div>
                );
              })}
              {todayPct != null ? (
                <div
                  className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[var(--foreground)]"
                  style={{ left: `${todayPct}%` }}
                  title="Aujourd'hui"
                />
              ) : null}
            </div>
          </div>

          {/* Groupes et barres */}
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
                      {/* Grille verticale */}
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
                          title={`${format(bar.start, "d MMM", { locale: fr })} → ${format(bar.end, "d MMM yyyy", { locale: fr })}`}
                        >
                          <div className="flex h-full items-center">
                            <span className="truncate text-[10px] font-semibold text-white drop-shadow-sm">
                              {format(bar.start, "d/MM", { locale: fr })}–{format(bar.end, "d/MM", { locale: fr })}
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
        Semaines · ligne verticale = aujourd&apos;hui · barres = durée planifiée (créneaux ou échéance)
      </div>
    </section>
  );
}
