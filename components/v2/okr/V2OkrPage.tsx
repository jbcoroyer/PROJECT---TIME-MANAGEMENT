"use client";

import { useMemo, useRef, useState } from "react";
import { Calendar, Lock, Plus, Target, Users } from "lucide-react";
import { useReferenceData } from "../../../lib/useReferenceData";
import { useTasks } from "../../../lib/useTasks";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { useObjectives, type ObjectiveScope } from "../../../lib/v2/okr";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import EmptyState from "../../ui/EmptyState";
import ObjectiveCard, { OkrStats } from "./ObjectiveCard";

type Tab = ObjectiveScope;

export default function V2OkrPage() {
  const { t, locale } = useTranslation();
  const { user } = useCurrentUser();
  const { domains } = useReferenceData();
  const { tasks } = useTasks();
  const {
    objectives,
    addObjective,
    updateObjective,
    removeObjective,
    addKeyResult,
    updateKeyResult,
    removeKeyResult,
  } = useObjectives();

  const [tab, setTab] = useState<Tab>("team");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const activeTasks = useMemo(() => tasks.filter((task) => !task.isArchived && !task.parentTaskId), [tasks]);

  const filtered = useMemo(
    () => objectives.filter((obj) => obj.scope === tab),
    [objectives, tab],
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [filtered],
  );

  const createObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addObjective({
      title: title.trim(),
      scope: tab,
      dueDate: dueDate || null,
      description: description.trim() || null,
    });
    setTitle("");
    setDescription("");
    setDueDate("");
  };

  const emptyKey = tab === "team" ? "team" : "personal";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="ui-surface relative overflow-hidden rounded-[28px] p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--accent)]/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            <Target className="h-3.5 w-3.5" /> {t("okrModule.badge")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{t("okrModule.title")}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/55">
            {t("okrModule.subtitle")}
          </p>
        </div>
      </header>

      <div className="flex gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-1">
        <button
          type="button"
          onClick={() => setTab("team")}
          className={`ui-transition flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            tab === "team"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
              : "text-[color:var(--foreground)]/55 hover:text-[var(--foreground)]"
          }`}
        >
          <Users className="h-4 w-4" />
          {t("okrModule.tabTeam")}
        </button>
        <button
          type="button"
          onClick={() => setTab("personal")}
          className={`ui-transition flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            tab === "personal"
              ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
              : "text-[color:var(--foreground)]/55 hover:text-[var(--foreground)]"
          }`}
        >
          <Lock className="h-4 w-4" />
          {t("okrModule.tabPersonal")}
        </button>
      </div>

      <section className="ui-surface rounded-2xl p-5">
        <h2 className="mb-1 text-base font-semibold text-[var(--foreground)]">
          {tab === "team" ? t("okrModule.newTeamObjective") : t("okrModule.newPersonalObjective")}
        </h2>
        <p className="mb-4 text-sm text-[color:var(--foreground)]/55">
          {tab === "team" ? t("okrModule.teamHint") : t("okrModule.personalHint")}
        </p>
        <form onSubmit={createObjective} className="space-y-3">
          <input
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("okrModule.objectivePlaceholder")}
            className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("okrModule.descriptionPlaceholder")}
            rows={2}
            className="ui-focus-ring w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm">
              <Calendar className="h-4 w-4 text-[color:var(--foreground)]/45" />
              <span className="text-[color:var(--foreground)]/55">{t("okrModule.deadline")}</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="ui-focus-ring rounded-lg border-0 bg-transparent text-sm text-[var(--foreground)]"
              />
            </label>
            <button
              type="submit"
              disabled={!title.trim()}
              className="ui-transition ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> {t("okrModule.create")}
            </button>
          </div>
        </form>
      </section>

      <OkrStats objectives={filtered} activeTasks={activeTasks} />

      {sorted.length === 0 ? (
        <EmptyState
          icon={tab === "team" ? Users : Lock}
          title={t(`emptyStates.okr.${emptyKey}.title`)}
          description={t(`emptyStates.okr.${emptyKey}.body`)}
          actionLabel={t(`emptyStates.okr.${emptyKey}.cta`)}
          onAction={() => titleInputRef.current?.focus()}
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              scope={tab}
              activeTasks={activeTasks}
              locale={locale}
              userId={user?.id ?? null}
              isAdmin={user?.isAdmin ?? false}
              onUpdate={updateObjective}
              onRemove={removeObjective}
              onAddKeyResult={addKeyResult}
              onUpdateKeyResult={updateKeyResult}
              onRemoveKeyResult={removeKeyResult}
              domains={domains}
            />
          ))}
        </div>
      )}
    </div>
  );
}
