"use client";

import { useMemo, useState } from "react";
import {
  ChevronUp,
  KanbanSquare,
  Lightbulb,
  Plus,
  Sparkles,
} from "lucide-react";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { useReferenceData } from "../../../lib/useReferenceData";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { useStockIdeas } from "../../../lib/useStockIdeas";
import type { StockIdea, StockIdeaStatus } from "../../../lib/stockIdeasTypes";
import { createQuickTask } from "../../../lib/v2/createTask";
import { toastError, toastSuccess } from "../../../lib/toast";

const STATUS_COLUMNS: { status: StockIdeaStatus; labelKey: string; cls: string }[] = [
  { status: "nouveau", labelKey: "ideasBox.status.nouveau", cls: "border-t-slate-300" },
  { status: "etude", labelKey: "ideasBox.status.etude", cls: "border-t-sky-400" },
  { status: "adopte", labelKey: "ideasBox.status.adopte", cls: "border-t-[var(--accent-violet)]" },
  { status: "archive", labelKey: "ideasBox.status.archive", cls: "border-t-[var(--line-strong)]" },
];

const NEXT_STATUS: Record<StockIdeaStatus, StockIdeaStatus | null> = {
  nouveau: "etude",
  etude: "adopte",
  adopte: "archive",
  archive: null,
};

export default function V2IdeasPage() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const { admins, companies, domains } = useReferenceData();
  const { ideas, canManage, addIdea, updateIdea, voteIdea } = useStockIdeas();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [converting, setConverting] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byStatus: Record<StockIdeaStatus, StockIdea[]> = {
      nouveau: [],
      etude: [],
      adopte: [],
      archive: [],
    };
    for (const idea of ideas) byStatus[idea.status]?.push(idea);
    for (const status of Object.keys(byStatus) as StockIdeaStatus[]) {
      byStatus[status].sort((a, b) => b.votes - a.votes);
    }
    return byStatus;
  }, [ideas]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addIdea({ title: title.trim(), description: description.trim(), status: "nouveau" });
    setTitle("");
    setDescription("");
    toastSuccess(t("ideasBox.submitSuccess"));
  };

  const promote = (idea: StockIdea) => {
    const next = NEXT_STATUS[idea.status];
    if (!next) return;
    updateIdea(idea.id, { status: next });
  };

  const convertToTask = async (idea: StockIdea) => {
    const adminName = user?.teamMemberName?.trim() || admins[0]?.name?.trim() || "";
    if (!adminName) {
      toastError("Aucun collaborateur : ajoutez-en dans Paramètres.");
      return;
    }
    setConverting(idea.id);
    try {
      await createQuickTask({
        projectName: `[Idée] ${idea.title}`,
        company: companies[0]?.name ?? "",
        domain: domains.find((d) => d.name.includes("General"))?.name ?? domains[0]?.name ?? "🌎 General",
        adminName,
        description: idea.description,
        priority: "Moyenne",
      });
      if (canManage && idea.status === "nouveau") updateIdea(idea.id, { status: "adopte" });
      toastSuccess("Idée convertie en tâche Kanban");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Conversion impossible");
    } finally {
      setConverting(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-5">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          <Lightbulb className="h-3.5 w-3.5" /> {t("nav.ideas")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{t("ideasBox.composeTitle")}</h1>
        <p className="mt-1 text-sm text-[color:var(--foreground)]/55">{t("ideasBox.subtitle")}</p>
      </header>

      <section className="ui-surface rounded-2xl p-5">
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("ideasBox.titlePlaceholder")}
            className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("ideasBox.bodyPlaceholder")}
            rows={3}
            className="ui-focus-ring w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="ui-transition inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)]"
          >
            <Plus className="h-4 w-4" /> {t("ideasBox.submit")}
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        {STATUS_COLUMNS.map((col) => (
          <div key={col.status} className={`ui-surface rounded-2xl border-t-4 p-4 ${col.cls}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">{t(col.labelKey)}</h2>
              <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--foreground)]/55">
                {grouped[col.status].length}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[col.status].length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[color:var(--foreground)]/45">
                  {t("ideasBox.emptyFilter")}
                </p>
              ) : (
                grouped[col.status].map((idea) => (
                  <article key={idea.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => voteIdea(idea.id, 1)}
                        className="ui-transition flex flex-col items-center rounded-lg border border-[var(--line)] px-2 py-1 text-[color:var(--foreground)]/60 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        aria-label={t("ideasBox.vote")}
                      >
                        <ChevronUp className="h-4 w-4" />
                        <span className="text-xs font-bold">{idea.votes}</span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{idea.title}</p>
                        {idea.description ? (
                          <p className="mt-0.5 line-clamp-3 text-[11px] text-[color:var(--foreground)]/55">
                            {idea.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {NEXT_STATUS[idea.status] && canManage ? (
                        <button
                          type="button"
                          onClick={() => promote(idea)}
                          className="ui-transition inline-flex items-center gap-1 rounded-lg border border-[var(--line-strong)] px-2 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
                        >
                          <Sparkles className="h-3 w-3" /> {t("ideasBox.manage.adopt")}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={converting === idea.id}
                        onClick={() => void convertToTask(idea)}
                        className="ui-transition inline-flex items-center gap-1 rounded-lg border border-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-50"
                      >
                        <KanbanSquare className="h-3 w-3" /> En tâche
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
