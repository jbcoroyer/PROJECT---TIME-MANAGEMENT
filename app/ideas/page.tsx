"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { getDateFnsLocale } from "../../lib/i18n/dateFnsLocale";
import {
  ChevronUp,
  Download,
  Lightbulb,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import AppShell from "../../components/v2/AppShell";
import ModuleRouteGuard from "../../components/v2/ModuleRouteGuard";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { useBranding } from "../../lib/brandingContext";
import { useTranslation } from "../../lib/i18n/useTranslation";
import {
  type StockIdea,
  type StockIdeaStatus,
  useStockIdeas,
} from "../../lib/useStockIdeas";
import { toastSuccess } from "../../lib/toast";

type StatusFilter = "all" | StockIdeaStatus;

const STATUS_ORDER: StockIdeaStatus[] = ["nouveau", "etude", "adopte", "archive"];

export default function IdeasPage() {
  const { t, locale } = useTranslation();
  const { user: currentUser } = useCurrentUser();
  const { branding } = useBranding();
  const { ideas, hydrated, canManage, addIdea, updateIdea, removeIdea, voteIdea, exportJson } =
    useStockIdeas();
  const isGuest = !currentUser;
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ideas;
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (!q) return list;
    return list.filter(
      (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
    );
  }, [ideas, query, statusFilter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [filtered],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<StockIdeaStatus, number> = {
      nouveau: 0,
      etude: 0,
      adopte: 0,
      archive: 0,
    };
    for (const idea of ideas) counts[idea.status] += 1;
    return counts;
  }, [ideas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    addIdea({
      title: trimmedTitle,
      description: description.trim(),
      status: "nouveau",
    });
    setTitle("");
    setDescription("");
    toastSuccess(t("ideasBox.submitSuccess"));
  };

  const content = (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="ui-surface relative overflow-hidden rounded-[28px] p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--accent)]/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--accent-contrast)]">
            <Lightbulb className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/50">
              {branding.appName}
            </p>
            <h1 className="ui-heading mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              {t("nav.ideas")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--foreground)]/60">
              {t("ideasBox.subtitle")}
            </p>
            {isGuest ? (
              <p className="mt-3 text-sm text-[color:var(--foreground)]/55">
                {t("ideasBox.guestHint")}{" "}
                <Link href="/login" className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline">
                  {t("ideasBox.guestLogin")}
                </Link>
              </p>
            ) : null}
          </div>
          {canManage ? (
            <button
              type="button"
              onClick={() => exportJson()}
              className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)]/75 hover:border-[var(--line-strong)]"
            >
              <Download className="h-4 w-4" />
              {t("ideasBox.exportJson")}
            </button>
          ) : null}
        </div>
      </header>

      <section id="ideas-compose" className="ui-surface rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("ideasBox.composeTitle")}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("ideasBox.titlePlaceholder")}
            className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] placeholder:text-[color:var(--foreground)]/40"
            maxLength={200}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("ideasBox.bodyPlaceholder")}
            rows={4}
            className="ui-focus-ring w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[color:var(--foreground)]/40"
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={!title.trim() || !hydrated}
            className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t("ideasBox.submit")}
          </button>
        </form>
      </section>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[color:var(--foreground)]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ideasBox.searchPlaceholder")}
            className="ui-focus-ring min-w-[160px] flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[color:var(--foreground)]/40"
          />
          <span className="text-xs font-semibold text-[color:var(--foreground)]/50">
            {t("ideasBox.count", { count: filtered.length })}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            label={t("ideasBox.filterAll")}
            count={ideas.length}
          />
          {STATUS_ORDER.map((status) => (
            <FilterChip
              key={status}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              label={t(`ideasBox.status.${status}`)}
              count={statusCounts[status]}
            />
          ))}
        </div>
      </div>

      {ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={t("emptyStates.ideas.title")}
          description={t("emptyStates.ideas.body")}
          actionLabel={t("emptyStates.ideas.cta")}
          onAction={() => {
            document.getElementById("ideas-compose")?.scrollIntoView({ behavior: "smooth", block: "start" });
            titleInputRef.current?.focus();
          }}
        />
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] px-6 py-12 text-center text-sm text-[color:var(--foreground)]/55">
          {t("ideasBox.emptyFilter")}
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              locale={locale}
              canManage={canManage}
              canVote={!isGuest}
              onVote={() => voteIdea(idea.id, 1)}
              onStatus={(s) => updateIdea(idea.id, { status: s })}
              onRemove={async () => {
                const ok = await confirm({
                  title: t("ideasBox.manage.removeTitle"),
                  description: t("ideasBox.manage.removeBody"),
                  confirmLabel: t("ideasBox.manage.removeConfirm"),
                  variant: "destructive",
                });
                if (ok) removeIdea(idea.id);
              }}
              t={t}
            />
          ))}
        </ul>
      )}
    </div>
  );

  if (currentUser) {
    return (
      <ModuleRouteGuard>
        <AppShell
          currentUserName={currentUser.teamMemberName ?? currentUser.displayName ?? undefined}
          currentUserEmail={currentUser.email}
          currentUserAvatarUrl={currentUser.avatarUrl ?? null}
          currentUserJobTitle={currentUser.jobTitle ?? null}
        >
          {content}
        </AppShell>
      </ModuleRouteGuard>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 lg:px-8">
      {content}
    </div>
  );
}

function FilterChip(props: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  const { active, onClick, label, count } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "ui-transition inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]",
      ].join(" ")}
    >
      {label}
      <span className={active ? "opacity-80" : "text-[color:var(--foreground)]/45"}>{count}</span>
    </button>
  );
}

function formatIdeaDate(iso: string, locale: "fr" | "en" | "es"): string {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: getDateFnsLocale(locale) });
  } catch {
    return "";
  }
}

function IdeaCard(props: {
  idea: StockIdea;
  locale: "fr" | "en" | "es";
  canManage: boolean;
  canVote: boolean;
  onVote: () => void;
  onStatus: (s: StockIdeaStatus) => void;
  onRemove: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const { idea, locale, canManage, canVote, onVote, onStatus, onRemove, t } = props;
  const created = formatIdeaDate(idea.createdAt, locale);

  return (
    <li className="ui-surface rounded-2xl border border-[var(--line)] p-4">
      <div className="flex gap-3">
        {canVote ? (
          <button
            type="button"
            onClick={onVote}
            className="ui-transition flex shrink-0 flex-col items-center rounded-xl border border-[var(--line)] px-2.5 py-2 text-[color:var(--foreground)]/60 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label={t("ideasBox.vote")}
          >
            <ChevronUp className="h-4 w-4" />
            <span className="text-xs font-bold tabular-nums">{idea.votes}</span>
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--foreground)]/50">
              {t(`ideasBox.status.${idea.status}`)}
            </span>
            {created ? (
              <span className="text-[11px] text-[color:var(--foreground)]/45">{created}</span>
            ) : null}
            {!canVote && idea.votes > 0 ? (
              <span className="text-[11px] font-semibold text-[color:var(--foreground)]/55">
                {idea.votes} ↑
              </span>
            ) : null}
          </div>
          <h3 className="mt-1.5 text-base font-semibold leading-snug text-[var(--foreground)]">{idea.title}</h3>
          {idea.description ? (
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--foreground)]/65 whitespace-pre-wrap">
              {idea.description}
            </p>
          ) : null}
          {canManage ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {idea.status === "nouveau" ? (
                <ManageBtn label={t("ideasBox.manage.toReview")} onClick={() => onStatus("etude")} />
              ) : null}
              {(idea.status === "nouveau" || idea.status === "etude") && (
                <ManageBtn label={t("ideasBox.manage.adopt")} onClick={() => onStatus("adopte")} />
              )}
              {idea.status !== "archive" ? (
                <ManageBtn label={t("ideasBox.manage.archive")} onClick={() => onStatus("archive")} />
              ) : (
                <ManageBtn label={t("ideasBox.manage.reopen")} onClick={() => onStatus("nouveau")} />
              )}
              <button
                type="button"
                onClick={onRemove}
                className="ui-transition ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))]"
                title={t("ideasBox.manage.removeConfirm")}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function ManageBtn(props: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="ui-transition rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1 text-[10px] font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface)]"
    >
      {props.label}
    </button>
  );
}
