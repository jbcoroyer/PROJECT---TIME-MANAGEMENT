"use client";

import { format } from "date-fns";
import { Calendar, Lock, Plus, Target, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import type { AppLocale } from "../../../lib/i18n/index";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { Task } from "../../../lib/types";
import {
  canDeleteObjective,
  keyResultProgress,
  objectiveDueStatus,
  objectiveProgress,
  type Objective,
  type ObjectiveScope,
} from "../../../lib/v2/okr";

type KrDraft = { label: string; domain: string; target: number };

type Props = {
  objective: Objective;
  scope: ObjectiveScope;
  activeTasks: Task[];
  locale: AppLocale;
  userId: string | null;
  isAdmin: boolean;
  onUpdate: (id: string, patch: { title?: string; description?: string | null; dueDate?: string | null }) => void;
  onRemove: (id: string) => void;
  onAddKeyResult: (objectiveId: string, kr: { label: string; linkedDomain: string | null; target: number; current: number }) => void;
  onUpdateKeyResult: (objectiveId: string, krId: string, patch: { current?: number }) => void;
  onRemoveKeyResult: (objectiveId: string, krId: string) => void;
  domains: { name: string }[];
};

export default function ObjectiveCard({
  objective,
  scope,
  activeTasks,
  locale,
  userId,
  isAdmin,
  onUpdate,
  onRemove,
  onAddKeyResult,
  onUpdateKeyResult,
  onRemoveKeyResult,
  domains,
}: Props) {
  const { t } = useTranslation();
  const dateLocale = getDateFnsLocale(locale);
  const progress = objectiveProgress(objective, activeTasks);
  const dueStatus = objectiveDueStatus(objective, activeTasks);
  const pct = Math.round(progress * 100);
  const canDelete = canDeleteObjective(objective, userId, isAdmin);

  const [krDraft, setKrDraft] = useState<KrDraft>({ label: "", domain: "", target: 1 });
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(objective.title);

  const dueLabel = useMemo(() => {
    if (!objective.dueDate) return null;
    try {
      return format(new Date(`${objective.dueDate}T12:00:00`), "d MMM yyyy", { locale: dateLocale });
    } catch {
      return objective.dueDate;
    }
  }, [objective.dueDate, dateLocale]);

  const submitKr = () => {
    if (!krDraft.label.trim()) return;
    onAddKeyResult(objective.id, {
      label: krDraft.label.trim(),
      linkedDomain: krDraft.domain || null,
      target: krDraft.target || 1,
      current: 0,
    });
    setKrDraft({ label: "", domain: "", target: 1 });
  };

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== objective.title) {
      onUpdate(objective.id, { title: trimmed });
    }
    setEditingTitle(false);
  };

  const dueBadgeClass =
    dueStatus === "overdue"
      ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
      : dueStatus === "upcoming"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : dueStatus === "done"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/60";

  return (
    <article className="ui-surface overflow-hidden rounded-2xl">
      <div className="border-b border-[var(--line)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {scope === "team" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--foreground)]/55">
                  <Users className="h-3 w-3" /> {t("okrModule.teamBadge")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--foreground)]/55">
                  <Lock className="h-3 w-3" /> {t("okrModule.personalBadge")}
                </span>
              )}
              {dueLabel ? (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${dueBadgeClass}`}>
                  <Calendar className="h-3 w-3" />
                  {dueStatus === "overdue" ? t("okrModule.overdue", { date: dueLabel }) : dueLabel}
                </span>
              ) : null}
              <label className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--foreground)]/55">
                <Calendar className="h-3 w-3" />
                <input
                  type="date"
                  value={objective.dueDate ?? ""}
                  onChange={(e) => onUpdate(objective.id, { dueDate: e.target.value || null })}
                  className="ui-focus-ring border-0 bg-transparent p-0 text-[10px] text-[var(--foreground)]"
                  aria-label={t("okrModule.deadline")}
                />
              </label>
              {objective.period ? (
                <span className="text-[10px] text-[color:var(--foreground)]/45">{objective.period}</span>
              ) : null}
            </div>

            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") {
                    setTitleDraft(objective.title);
                    setEditingTitle(false);
                  }
                }}
                className="ui-focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-base font-semibold"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleDraft(objective.title);
                  setEditingTitle(true);
                }}
                className="text-left text-base font-semibold text-[var(--foreground)] hover:text-[var(--accent)]"
              >
                {objective.title}
              </button>
            )}

            {objective.description ? (
              <p className="mt-1 text-sm text-[color:var(--foreground)]/55">{objective.description}</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-[var(--accent)]">{pct}%</p>
              <p className="text-[10px] text-[color:var(--foreground)]/45">
                {objective.keyResults.length}{" "}
                {objective.keyResults.length === 1 ? t("okrModule.krSingular") : t("okrModule.krPlural")}
              </p>
            </div>
            {canDelete ? (
              <button
                type="button"
                onClick={() => onRemove(objective.id)}
                className="ui-transition rounded-lg p-1.5 text-[color:var(--foreground)]/40 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                aria-label={t("okrModule.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {objective.keyResults.length > 0 ? (
        <ul className="divide-y divide-[var(--line)]">
          {objective.keyResults.map((kr) => {
            const p = keyResultProgress(kr, activeTasks);
            const krPct = Math.round(p.ratio * 100);
            return (
              <li key={kr.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)]">{kr.label}</p>
                    {kr.linkedDomain ? (
                      <p className="mt-0.5 text-[11px] text-[color:var(--foreground)]/45">
                        {t("okrModule.linkedDomain", { domain: kr.linkedDomain })}
                      </p>
                    ) : null}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                      <div className="h-full rounded-full bg-[var(--accent)]/80" style={{ width: `${krPct}%` }} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-[color:var(--foreground)]/60">
                      {p.auto
                        ? t("okrModule.progressAuto", { current: p.value, target: kr.target })
                        : `${kr.current}/${kr.target}`}
                    </span>
                    {!p.auto ? (
                      <input
                        type="number"
                        min={0}
                        value={kr.current}
                        onChange={(e) =>
                          onUpdateKeyResult(objective.id, kr.id, {
                            current: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="ui-focus-ring w-16 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs"
                        aria-label={t("okrModule.currentValue")}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onRemoveKeyResult(objective.id, kr.id)}
                      className="ui-transition text-[color:var(--foreground)]/35 hover:text-[var(--danger)]"
                      aria-label={t("okrModule.delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-[color:var(--foreground)]/45">{t("okrModule.noKeyResults")}</p>
      )}

      <div className="flex flex-wrap items-end gap-2 border-t border-[var(--line)] bg-[var(--surface-soft)]/50 p-4">
        <input
          value={krDraft.label}
          onChange={(e) => setKrDraft((d) => ({ ...d, label: e.target.value }))}
          placeholder={t("okrModule.krPlaceholder")}
          className="ui-focus-ring min-w-[160px] flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && submitKr()}
        />
        <select
          value={krDraft.domain}
          onChange={(e) => setKrDraft((d) => ({ ...d, domain: e.target.value }))}
          className="ui-focus-ring rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
          aria-label={t("okrModule.trackingMode")}
        >
          <option value="">{t("okrModule.manual")}</option>
          {domains.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={krDraft.target}
          onChange={(e) => setKrDraft((d) => ({ ...d, target: Math.max(1, Number(e.target.value) || 1) }))}
          placeholder={t("okrModule.target")}
          className="ui-focus-ring w-20 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
          aria-label={t("okrModule.target")}
        />
        <button
          type="button"
          onClick={submitKr}
          disabled={!krDraft.label.trim()}
          className="ui-transition inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)] disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> {t("okrModule.addKr")}
        </button>
      </div>
    </article>
  );
}

export function OkrStats({ objectives, activeTasks }: { objectives: Objective[]; activeTasks: Task[] }) {
  const { t } = useTranslation();
  const stats = useMemo(() => {
    let overdue = 0;
    let onTrack = 0;
    for (const obj of objectives) {
      const status = objectiveDueStatus(obj, activeTasks);
      if (status === "overdue") overdue += 1;
      else if (objectiveProgress(obj, activeTasks) >= 1) onTrack += 1;
    }
    return { total: objectives.length, overdue, completed: onTrack };
  }, [objectives, activeTasks]);

  if (stats.total === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[color:var(--foreground)]/70">
        <Target className="h-3.5 w-3.5 text-[var(--accent)]" />
        {t("okrModule.statsTotal", { count: stats.total })}
      </span>
      {stats.completed > 0 ? (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-400">
          {t("okrModule.statsCompleted", { count: stats.completed })}
        </span>
      ) : null}
      {stats.overdue > 0 ? (
        <span className="rounded-full border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-1 text-[var(--danger)]">
          {t("okrModule.statsOverdue", { count: stats.overdue })}
        </span>
      ) : null}
    </div>
  );
}
