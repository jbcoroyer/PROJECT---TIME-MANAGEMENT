"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfISOWeek,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfISOWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GanttChartSquare,
  LayoutGrid,
  Scale,
  ShieldAlert,
} from "lucide-react";
import RetroplanningGantt, {
  RetroplanningGroupToggle,
} from "./RetroplanningGantt";
import type { RetroplanningGroupBy } from "../../../lib/v2/retroplanning";
import { useTasks } from "../../../lib/useTasks";
import { DONE_COLUMN_NAME } from "../../../lib/workflowConstants";
import {
  buildWorkload,
  detectConflicts,
  DAILY_CAPACITY_HOURS,
} from "../../../lib/v2/workload";
import type { Task } from "../../../lib/types";
import EmptyState from "../../ui/EmptyState";

type ViewId = "retroplanning" | "week" | "month" | "workload";

function taskPrimaryDate(task: Task): Date | null {
  const slot = task.projectedWork.find((p) => p.date);
  const raw = slot?.date ?? task.deadline;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

const PRIORITY_DOT: Record<string, string> = {
  Haute: "bg-[var(--danger)]",
  Moyenne: "bg-[var(--warning)]",
  Basse: "bg-slate-400",
};

export default function V2PlanningPage() {
  const { t, locale } = useTranslation();
  const dateLocale = useMemo(() => getDateFnsLocale(locale), [locale]);
  const { tasks } = useTasks();
  const [view, setView] = useState<ViewId>("retroplanning");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [groupBy, setGroupBy] = useState<RetroplanningGroupBy>("tasks");

  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.isArchived && !t.parentTaskId && t.column !== DONE_COLUMN_NAME),
    [tasks],
  );

  const workload = useMemo(() => buildWorkload(tasks), [tasks]);
  const conflicts = useMemo(() => detectConflicts(tasks, workload), [tasks, workload]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [anchor]);

  const weekdayHeaders = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "EEE", { locale: dateLocale }));
  }, [dateLocale]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [anchor]);

  const tasksForDay = (day: Date) =>
    activeTasks.filter((t) => {
      const d = taskPrimaryDate(t);
      return d ? isSameDay(d, day) : false;
    });

  const navigate = (dir: -1 | 1) => {
    if (view === "retroplanning") {
      setAnchor((prev) => (dir === 1 ? addWeeks(prev, 4) : subWeeks(prev, 4)));
    } else if (view === "month") {
      setAnchor((prev) => (dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1)));
    } else {
      setAnchor((prev) => addDays(prev, dir * 7));
    }
  };

  const retroRangeStart = useMemo(() => startOfISOWeek(subWeeks(anchor, 2)), [anchor]);
  const retroRangeEnd = useMemo(() => endOfISOWeek(addWeeks(anchor, 10)), [anchor]);

  const rangeLabel =
    view === "retroplanning"
      ? t("planning.range.retroWeeks", {
          startWeek: format(retroRangeStart, "I"),
          endWeek: format(retroRangeEnd, "I"),
          year: format(retroRangeStart, "yyyy"),
        })
      : view === "week"
        ? t("planning.range.weekOf", {
            date: format(weekDays[0], "d MMM", { locale: dateLocale }),
          })
        : format(anchor, "MMMM yyyy", { locale: dateLocale });

  const viewOptions = useMemo(
    () =>
      [
        { id: "retroplanning" as const, label: t("planning.views.retroplanning"), icon: GanttChartSquare },
        { id: "week" as const, label: t("planning.views.week"), icon: LayoutGrid },
        { id: "month" as const, label: t("planning.views.month"), icon: CalendarDays },
        { id: "workload" as const, label: t("planning.views.workload"), icon: Scale },
      ] as const,
    [t],
  );

  return (
      <div className="space-y-5">
        <header className="ui-surface flex flex-wrap items-start justify-between gap-4 rounded-2xl border-l-4 border-l-[var(--accent)] p-5">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              <CalendarDays className="h-3.5 w-3.5" /> {t("planning.badge")}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{t("planning.title")}</h1>
            <p className="mt-1 text-sm text-[color:var(--foreground)]/55">{t("planning.subtitle")}</p>
          </div>
          {conflicts.length > 0 ? (
            <span className="ui-pill ui-pill-danger inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4" /> {t("planning.conflictsCount", { count: conflicts.length })}
            </span>
          ) : (
            <span className="ui-pill ui-pill-success inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
              {t("planning.noConflicts")}
            </span>
          )}
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-1">
            {viewOptions.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={[
                    "ui-transition inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
                    active ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : "text-[color:var(--foreground)]/60 hover:bg-[var(--surface)]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {v.label}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="ui-transition flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-soft)]"
              aria-label={t("planning.nav.previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[160px] text-center text-sm font-semibold capitalize text-[var(--foreground)]">
              {rangeLabel}
            </span>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="ui-transition flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-soft)]"
              aria-label={t("planning.nav.next")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {view === "retroplanning" ? (
          <div className="space-y-3">
            <RetroplanningGroupToggle value={groupBy} onChange={setGroupBy} />
            <RetroplanningGantt
              tasks={activeTasks}
              rangeStart={retroRangeStart}
              rangeEnd={retroRangeEnd}
              groupBy={groupBy}
            />
          </div>
        ) : null}

        {view === "week" ? (
          activeTasks.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={t("emptyStates.planning.title")}
              description={t("emptyStates.planning.body")}
              actionLabel={t("emptyStates.planning.cta")}
              actionHref="/dashboard/kanban"
            />
          ) : (
          <section className="ui-surface overflow-x-auto rounded-2xl p-4">
            <div className="grid min-w-[840px] grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayTasks = tasksForDay(day);
                const today = isSameDay(day, new Date());
                return (
                  <div key={day.toISOString()} className="rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                    <div className={`rounded-t-xl px-3 py-2 text-center text-xs font-semibold ${today ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[color:var(--foreground)]/60"}`}>
                      {format(day, "EEE d", { locale: dateLocale })}
                    </div>
                    <div className="space-y-1.5 p-2">
                      {dayTasks.length === 0 ? (
                        <p className="py-3 text-center text-[10px] text-[color:var(--foreground)]/35">—</p>
                      ) : (
                        dayTasks.map((task) => (
                          <div key={task.id} className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-slate-400"}`} />
                              <p className="truncate text-[11px] font-semibold text-[var(--foreground)]">{task.projectName}</p>
                            </div>
                            <p className="mt-0.5 truncate text-[10px] text-[color:var(--foreground)]/50">
                              {task.admins[0] ?? t("planning.unassigned")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )
        ) : null}

        {view === "month" ? (
          activeTasks.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title={t("emptyStates.planning.title")}
              description={t("emptyStates.planning.body")}
              actionLabel={t("emptyStates.planning.cta")}
              actionHref="/dashboard/kanban"
            />
          ) : (
          <section className="ui-surface rounded-2xl p-4">
            <div className="grid grid-cols-7 gap-1">
              {weekdayHeaders.map((d) => (
                <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase text-[color:var(--foreground)]/45">
                  {d}
                </div>
              ))}
              {monthDays.map((day) => {
                const dayTasks = tasksForDay(day);
                const inMonth = day.getMonth() === anchor.getMonth();
                const today = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={[
                      "min-h-[92px] rounded-lg border p-1.5",
                      inMonth ? "border-[var(--line)] bg-[var(--surface)]" : "border-transparent bg-[var(--surface-soft)]/40 opacity-50",
                    ].join(" ")}
                  >
                    <div className={`text-right text-[11px] font-semibold ${today ? "text-[var(--accent)]" : "text-[color:var(--foreground)]/50"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 3).map((taskItem) => (
                        <div key={taskItem.id} className="flex items-center gap-1 truncate rounded bg-[var(--accent-soft)] px-1 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[taskItem.priority] ?? "bg-slate-400"}`} />
                          <span className="truncate">{taskItem.projectName}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 ? (
                        <p className="text-[10px] text-[color:var(--foreground)]/45">+{dayTasks.length - 3}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )
        ) : null}

        {view === "workload" ? (
          <section className="ui-surface overflow-x-auto rounded-2xl p-4">
            {workload.length === 0 ? (
              <EmptyState
                compact
                icon={Scale}
                title={t("emptyStates.planning.title")}
                description={t("emptyStates.planning.body")}
                actionLabel={t("emptyStates.planning.cta")}
                actionHref="/dashboard/kanban"
              />
            ) : (
              <table className="w-full min-w-[840px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-[11px] uppercase text-[color:var(--foreground)]/45">{t("planning.workload.personHeader")}</th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="px-1 py-2 text-center text-[11px] font-semibold text-[color:var(--foreground)]/55">
                        {format(day, "EEE d", { locale: dateLocale })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workload.map((p) => (
                    <tr key={p.person} className="border-t border-[var(--line)]">
                      <td className="px-2 py-2 text-sm font-semibold text-[var(--foreground)]">{p.person}</td>
                      {weekDays.map((day) => {
                        const key = format(day, "yyyy-MM-dd");
                        const load = p.byDate.get(key)?.hours ?? 0;
                        const ratio = Math.min(1.5, load / DAILY_CAPACITY_HOURS);
                        const over = load > DAILY_CAPACITY_HOURS + 0.01;
                        return (
                          <td key={key} className="px-1 py-1.5 text-center">
                            <div
                              className={[
                                "mx-auto flex h-9 w-full max-w-[64px] items-center justify-center rounded-lg text-[11px] font-bold",
                                load === 0 ? "text-[color:var(--foreground)]/25" : over ? "text-white" : "text-[var(--foreground)]",
                              ].join(" ")}
                              style={{
                                backgroundColor:
                                  load === 0
                                    ? "var(--surface-soft)"
                                    : over
                                      ? "var(--danger)"
                                      : `color-mix(in srgb, var(--accent) ${Math.round(ratio * 55)}%, var(--surface))`,
                              }}
                              title={t("planning.workload.hoursTitle", { hours: load.toFixed(1) })}
                            >
                              {load === 0 ? "·" : `${load.toFixed(1)}`}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ) : null}

        {conflicts.length > 0 ? (
          <section className="ui-surface rounded-2xl p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
              <AlertTriangle className="h-4 w-4 text-[var(--danger)]" /> {t("planning.conflicts.title")}
            </h2>
            <ul className="space-y-2">
              {conflicts.map((c) => (
                <li key={c.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={[
                        "mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        c.kind === "overload" ? "ui-pill ui-pill-danger" : "ui-pill ui-pill-warning",
                      ].join(" ")}
                    >
                      {c.kind === "overload" ? t("planning.conflicts.overload") : t("planning.conflicts.overlap")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">{c.message}</p>
                      <p className="mt-0.5 text-[12px] text-[var(--accent)]">💡 {c.suggestion}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
  );
}
