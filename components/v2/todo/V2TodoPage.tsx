"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarCheck, Coffee, Loader2, Sparkles, Sun } from "lucide-react";
import { getIntlLocale } from "../../../lib/i18n/dateFnsLocale";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { useTasks } from "../../../lib/useTasks";
import { buildDayPlan, type PlanBlock } from "../../../lib/v2/planner";
import { summarize } from "../../../lib/v2/aiClient";
import { toastError } from "../../../lib/toast";

const KIND_ICON: Record<PlanBlock["kind"], typeof Coffee> = {
  task: CalendarCheck,
  break: Coffee,
  focus: Sun,
};

export default function V2TodoPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const intlLocale = useMemo(() => getIntlLocale(locale), [locale]);
  const { user } = useCurrentUser();
  const { tasks } = useTasks();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const userName = user?.teamMemberName ?? user?.displayName ?? null;

  const plan = useMemo(() => buildDayPlan(tasks, userName, now), [tasks, userName, now]);

  const totalMinutes = useMemo(
    () =>
      plan
        .filter((b) => b.kind === "task")
        .reduce((acc, b) => {
          const [sh, sm] = b.start.split(":").map(Number);
          const [eh, em] = b.end.split(":").map(Number);
          return acc + (eh * 60 + em - (sh * 60 + sm));
        }, 0),
    [plan],
  );

  const plannedHours = Math.round((totalMinutes / 60) * 10) / 10;

  const enrich = async () => {
    if (aiBusy) return;
    setAiBusy(true);
    try {
      const bullets = plan
        .filter((b) => b.kind === "task")
        .map((b) => `${b.start}-${b.end} : ${b.title} (${b.reason})`);
      if (bullets.length === 0) bullets.push(t("todoModule.ai.noTasksToday"));
      const result = await summarize(
        t("todoModule.ai.agendaTitle", { date: now.toLocaleDateString(intlLocale) }),
        bullets,
        t("todoModule.ai.prompt"),
      );
      setAiText(result.text);
    } catch {
      toastError(t("todoModule.toast.aiError"));
    } finally {
      setAiBusy(false);
    }
  };

  const openTask = () => router.push("/dashboard/kanban");

  return (
    <div className="space-y-5">
      <header className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-5">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          <CalendarCheck className="h-3.5 w-3.5" /> {t("todoModule.badge")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          {userName
            ? t("todoModule.greeting", { name: userName.split(" ")[0] })
            : t("todoModule.titleFallback")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[color:var(--foreground)]/55">
          {t("todoModule.introPart1")}
          <strong className="font-semibold text-[color:var(--foreground)]/75">{t("todoModule.introAgenda")}</strong>
          {t("todoModule.introPart2")}
          <strong className="font-semibold text-[color:var(--foreground)]/75">{t("todoModule.introMyTasks")}</strong>
          {t("todoModule.introPart3")}
        </p>
        <Link
          href="/dashboard/todo"
          className="ui-transition mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))]"
        >
          {t("todoModule.openMyTasks")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="ui-surface rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">{t("todoModule.timeBlockedTitle")}</h2>
              <p className="text-xs text-[color:var(--foreground)]/55">
                {t("todoModule.plannedHours", { hours: plannedHours })}
              </p>
            </div>
          </div>

          {!userName ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-4 py-10 text-center text-sm text-[color:var(--foreground)]/55">
              {t("todoModule.loginPrompt")}
            </p>
          ) : plan.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-4 py-10 text-center text-sm text-[color:var(--foreground)]/55">
              {t("todoModule.emptyPlan")}
            </p>
          ) : (
            <ol className="space-y-2">
              {plan.map((block, idx) => {
                const Icon = KIND_ICON[block.kind];
                const isTask = block.kind === "task";
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={isTask ? openTask : undefined}
                      className={[
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left",
                        isTask
                          ? "ui-transition border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]"
                          : "border-dashed border-[var(--line)] bg-[var(--surface-soft)]",
                      ].join(" ")}
                    >
                      <span className="flex w-16 shrink-0 flex-col text-[11px] font-semibold text-[color:var(--foreground)]/60">
                        <span>{block.start}</span>
                        <span className="opacity-60">{block.end}</span>
                      </span>
                      <span
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          isTask
                            ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "bg-[var(--surface)] text-[color:var(--foreground)]/45",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
                          {block.title}
                        </span>
                        <span className="block truncate text-[11px] text-[color:var(--foreground)]/55">
                          {block.reason}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="ui-surface rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--foreground)]">{t("todoModule.aiSectionTitle")}</h2>
            <button
              type="button"
              onClick={() => void enrich()}
              disabled={aiBusy || plan.length === 0}
              className="ui-transition inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-50"
            >
              {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {t("todoModule.optimize")}
            </button>
          </div>
          {aiText ? (
            <pre className="whitespace-pre-wrap rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-sm leading-relaxed text-[var(--foreground)]">
              {aiText}
            </pre>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-4 py-8 text-center text-xs text-[color:var(--foreground)]/55">
              {t("todoModule.aiEmptyHint")}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
