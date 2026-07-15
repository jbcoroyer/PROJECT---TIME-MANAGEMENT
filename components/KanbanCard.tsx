"use client";

import { memo, type CSSProperties } from "react";
import { motion } from "framer-motion";
import type { Task } from "../lib/types";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  ListChecks,
  Pencil,
  Trash2,
} from "lucide-react";
import { adminSolidColorFor, domainTagStyles } from "../lib/kanbanStyles";
import CompanyAvatar from "./CompanyAvatar";

function SubtaskBadge(props: { subtasks: Task[]; minimal?: boolean }) {
  const done = props.subtasks.filter((t) => t.column === "Terminé").length;
  const total = props.subtasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  if (props.minimal) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold tabular-nums text-[color:var(--foreground)]/55">
        <ListChecks className="h-2.5 w-2.5 shrink-0" />
        {done}/{total}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--foreground)]/65">
      <ListChecks className="h-3 w-3 shrink-0" />
      {done}/{total}
      <span
        className="ml-0.5 inline-block h-1.5 w-8 overflow-hidden rounded-full bg-[var(--line)]"
        aria-hidden
      >
        <span
          className="block h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}

function PriorityBadge({ priority, dense }: { priority: Task["priority"]; dense?: boolean }) {
  const styles = {
    Haute: { border: "rgba(180,69,63,0.4)", color: "var(--danger)" },
    Moyenne: { border: "rgba(176,115,32,0.4)", color: "var(--warning)" },
    Basse: { border: "rgba(62,125,82,0.4)", color: "var(--success)" },
  }[priority] ?? { border: "rgba(26,22,17,0.2)", color: "var(--ink-muted)" };

  return (
    <span
      className={[
        "inline-flex items-center rounded-[100px] border font-[family-name:var(--font-mono)] uppercase",
        dense ? "px-1.5 py-px text-[8px] tracking-[0.06em]" : "px-2 py-0.5 text-[9px] tracking-[0.08em]",
      ].join(" ")}
      style={{ borderColor: styles.border, color: styles.color }}
    >
      {dense ? priority.slice(0, 1) : priority}
    </span>
  );
}

function CardBody(props: {
  task: Task;
  currentNow: number;
  onEdit: () => void;
  onDelete: () => void;
  variant: "full" | "compact" | "dense";
  interactive: boolean;
  isMyTask?: boolean;
  companyLogoUrl?: string | null;
}) {
  const { task, currentNow, onEdit, onDelete, interactive, isMyTask } = props;

  const isDone = task.column === "Terminé";
  const deadlineMs = task.deadline ? new Date(task.deadline + "T23:59:59").getTime() : 0;
  const isOverdue = !isDone && deadlineMs > 0 && currentNow > deadlineMs;
  const isUrgent48h =
    !isDone &&
    deadlineMs > 0 &&
    deadlineMs - currentNow <= 48 * 60 * 60 * 1000 &&
    deadlineMs >= currentNow;
  const domainClass = domainTagStyles[task.domain] ?? domainTagStyles.default;

  return (
    <>
      {/* ── Ligne 1 : Admins + boutons actions ── */}
      <div
        className={[
          "flex items-center justify-between gap-2",
          props.variant === "dense" ? "min-w-0" : "",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center gap-1.5",
            props.variant === "dense"
              ? "min-w-0 flex-1 flex-nowrap overflow-x-auto [scrollbar-width:none] max-w-full [&::-webkit-scrollbar]:hidden"
              : "flex-wrap",
          ].join(" ")}
        >
          {task.admins.map((admin) => (
            <span
              key={admin}
              className={[
                "inline-flex shrink-0 items-center font-[family-name:var(--font-mono)] font-medium uppercase tracking-[0.06em]",
                props.variant === "dense"
                  ? "gap-1 text-[9px]"
                  : "gap-1.5 text-[10px]",
              ].join(" ")}
              style={{ color: adminSolidColorFor(admin) }}
            >
              <span
                className="h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: adminSolidColorFor(admin) }}
                aria-hidden
              />
              {props.variant === "dense"
                ? admin.split(" ")[0]?.slice(0, 10) ?? admin
                : admin.split(" ")[0]}
            </span>
          ))}

          {/* Indicateurs d'état urgence / retard */}
          {isOverdue && (
            <span
              className={[
                "shrink-0 rounded font-[family-name:var(--font-mono)] font-medium uppercase tracking-[0.08em]",
                props.variant === "dense" ? "px-1.5 py-px text-[9px]" : "px-[7px] py-0.5 text-[9px]",
              ].join(" ")}
              style={{ background: "rgba(180,69,63,0.12)", color: "var(--danger)" }}
            >
              {props.variant === "dense" ? "ret." : "Retard"}
            </span>
          )}
          {isUrgent48h && !isOverdue && (
            <span
              className={[
                "shrink-0 rounded font-[family-name:var(--font-mono)] font-medium uppercase tracking-[0.08em]",
                props.variant === "dense" ? "px-1.5 py-px text-[9px]" : "px-[7px] py-0.5 text-[9px]",
              ].join(" ")}
              style={{ background: "rgba(176,115,32,0.12)", color: "var(--warning)" }}
            >
              48h
            </span>
          )}
          {task.priority === "Haute" && (
            <span title="Priorité haute">
              <AlertTriangle
                className={props.variant === "dense" ? "h-2.5 w-2.5 text-[var(--warning)]" : "h-3 w-3 text-[var(--warning)]"}
              />
            </span>
          )}
          {isMyTask && (
            <span
              className={[
                "shrink-0 rounded-full bg-[color:var(--foreground)]/10 font-bold uppercase text-[color:var(--foreground)]/75",
                props.variant === "dense" ? "px-1 py-px text-[7px]" : "px-1.5 py-0.5 text-[9px] tracking-wide",
              ].join(" ")}
            >
              moi
            </span>
          )}
        </div>

        {/* Boutons d'action (hover) */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-[220ms] group-hover:opacity-100">
          <div className="flex items-center gap-0.5 rounded-full border border-[var(--line)] bg-[var(--surface)]/90 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className={[
                "inline-flex items-center justify-center rounded-full text-[color:var(--foreground)]/55 transition-colors",
                props.variant === "dense" ? "h-4 w-4" : "h-5 w-5",
                interactive ? "hover:bg-[var(--surface-soft)] hover:text-[color:var(--foreground)]/75" : "pointer-events-none",
              ].join(" ")}
              title="Modifier"
            >
              <Pencil className={props.variant === "dense" ? "h-2.5 w-2.5" : "h-3 w-3"} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={[
                "inline-flex items-center justify-center rounded-full text-[color:var(--foreground)]/45 transition-colors",
                props.variant === "dense" ? "h-4 w-4" : "h-5 w-5",
                interactive ? "hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] hover:text-[var(--danger)]" : "pointer-events-none",
              ].join(" ")}
              title="Archiver"
            >
              <Trash2 className={props.variant === "dense" ? "h-2.5 w-2.5" : "h-3 w-3"} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Ligne 2 : Nom du projet ── */}
      <p
        className={[
          "line-clamp-2 font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--ink)]",
          isDone ? "text-[rgba(26,22,17,0.45)] line-through" : "",
          props.variant === "dense"
            ? "text-[13px] leading-snug"
            : props.variant === "compact"
              ? "text-[15px]"
              : "text-[15.5px]",
        ].join(" ")}
      >
        {task.projectName || "Projet sans titre"}
      </p>

      {props.variant === "compact" ? (
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center justify-between gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <PriorityBadge priority={task.priority} />
              <span
                className={[
                  "inline-flex max-w-[7rem] truncate rounded border px-1 py-px text-[9px] font-semibold",
                  domainClass,
                ].join(" ")}
                title="Domaine — cliquez la carte pour modifier"
              >
                {task.domain}
              </span>
            </div>
            {task.subtasks && task.subtasks.length > 0 && <SubtaskBadge subtasks={task.subtasks} />}
          </div>
          {interactive ? (
            <p className="flex items-center gap-1 text-[8px] font-medium text-[color:var(--foreground)]/38 opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="h-2 w-2 shrink-0" aria-hidden />
              Cliquer pour modifier
            </p>
          ) : null}
        </div>
      ) : props.variant === "dense" ? (
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1 text-[9px] text-[color:var(--foreground)]/60">
            {task.company ? (
            <span className="inline-flex max-w-[5.5rem] items-center gap-0.5 truncate rounded border border-[var(--line)] bg-[var(--surface-soft)]/90 px-1 py-px">
              <CompanyAvatar
                name={task.company}
                logoUrl={props.companyLogoUrl}
                className="h-3 w-3 shrink-0 rounded-sm object-contain"
                fallbackClassName="flex h-3 w-3 shrink-0 items-center justify-center text-[color:var(--foreground)]/40"
                iconClassName="h-2.5 w-2.5"
              />
              <span className="truncate">{task.company}</span>
            </span>
            ) : null}
            {task.deadline && (
              <span
                className={[
                  "inline-flex shrink-0 items-center gap-0.5 rounded border px-1 py-px",
                  isOverdue
                    ? "ui-pill ui-pill-danger"
                    : isUrgent48h
                      ? "ui-pill ui-pill-warning"
                      : "border-[var(--line)] bg-[var(--surface-soft)]/80",
                ].join(" ")}
              >
                <CalendarDays className="h-2.5 w-2.5 shrink-0" />
                {task.deadline.length >= 10 ? task.deadline.slice(5) : task.deadline}
              </span>
            )}
            {(task.estimatedHours > 0 || task.estimatedDays > 0) && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded border border-[var(--line)] bg-[var(--surface-soft)]/80 px-1 py-px">
                <Clock3 className="h-2.5 w-2.5 shrink-0" />
                {task.estimatedHours > 0 ? `${task.estimatedHours}h` : `${task.estimatedDays}j`}
              </span>
            )}
            <span
              className={[
                "inline-flex max-w-[4.5rem] truncate rounded border px-1 py-px text-[8px] font-semibold leading-tight",
                domainClass,
              ].join(" ")}
            >
              {task.domain}
            </span>
            <PriorityBadge priority={task.priority} dense />
            {task.subtasks && task.subtasks.length > 0 && (
              <SubtaskBadge subtasks={task.subtasks} minimal />
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ── Ligne 3 : Métadonnées ── */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[color:var(--foreground)]/65">
            {task.company ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface-soft)]/80 px-1.5 py-0.5">
              <CompanyAvatar
                name={task.company}
                logoUrl={props.companyLogoUrl}
                className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain"
                fallbackClassName="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[color:var(--foreground)]/40"
                iconClassName="h-3 w-3"
              />
              <span className="max-w-[100px] truncate">{task.company}</span>
            </span>
            ) : null}
            {task.deadline && (
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5",
                  isOverdue
                    ? "ui-pill ui-pill-danger"
                    : isUrgent48h
                      ? "ui-pill ui-pill-warning"
                      : "border-[var(--line)] bg-[var(--surface-soft)]/80",
                ].join(" ")}
              >
                <CalendarDays className="h-3 w-3 shrink-0" />
                {task.deadline}
              </span>
            )}
            {(task.estimatedHours > 0 || task.estimatedDays > 0) && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface-soft)]/80 px-1.5 py-0.5 text-[color:var(--foreground)]/70">
                <Clock3 className="h-3 w-3 shrink-0" />
                {task.estimatedHours > 0 ? `${task.estimatedHours}h` : `${task.estimatedDays}j`}
              </span>
            )}
          </div>

          {/* ── Ligne 4 : Domaine + priorité + sous-tâches ── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                  domainClass,
                ].join(" ")}
                title="Domaine — cliquez la carte pour modifier"
              >
                {task.domain}
              </span>
              <span title="Priorité — cliquez la carte pour modifier">
                <PriorityBadge priority={task.priority} />
              </span>
            </div>
            {task.subtasks && task.subtasks.length > 0 && <SubtaskBadge subtasks={task.subtasks} />}
          </div>

          {interactive ? (
            <p className="flex items-center gap-1 text-[9px] font-medium text-[color:var(--foreground)]/38 opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="h-2.5 w-2.5 shrink-0" aria-hidden />
              Cliquer pour modifier domaine, priorité…
            </p>
          ) : null}
        </>
      )}
    </>
  );
}

function KanbanCardUIComponent(props: {
  task: Task;
  currentNow: number;
  onArchive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  variant?: "full" | "compact" | "dense";
  isOverlay?: boolean;
  isMyTask?: boolean;
  companyLogoUrl?: string | null;
  style?: CSSProperties;
}) {
  const { task, currentNow, onEdit, onDelete, isMyTask } = props;
  const variant = props.variant ?? "full";
  const isOverlay = props.isOverlay ?? false;
  const isDone = task.column === "Terminé";

  return (
    <motion.article
      style={props.style}
      layout={!isOverlay}
      initial={isOverlay ? false : { opacity: 0, y: 4 }}
      animate={isOverlay ? undefined : { opacity: 1, y: 0 }}
      transition={isOverlay ? undefined : { duration: 0.2 }}
      className={[
        "group relative flex flex-col border border-[rgba(26,22,17,0.14)] bg-[var(--surface)] text-xs text-[var(--foreground)] ui-transition",
        variant === "dense" ? "gap-1 rounded-2xl p-4" : variant === "compact" ? "gap-2 rounded-2xl p-4" : "gap-2.5 rounded-2xl p-4",
        isDone ? "opacity-55" : "",
        isOverlay
          ? "pointer-events-none rotate-2 shadow-2xl ring-1 ring-[var(--line)]/40"
          : !isDone
            ? "hover:-translate-y-0.5 hover:-rotate-[0.4deg] hover:border-[rgba(26,22,17,0.3)] hover:shadow-[0_18px_36px_rgba(26,22,17,0.12)]"
            : "",
      ].join(" ")}
    >
      <CardBody
        task={task}
        currentNow={currentNow}
        onEdit={onEdit}
        onDelete={onDelete}
        variant={variant}
        interactive={!isOverlay}
        isMyTask={isMyTask}
        companyLogoUrl={props.companyLogoUrl}
      />
    </motion.article>
  );
}

/**
 * Carte Kanban mémoïsée pour éviter les re-renders inutiles quand
 * le parent re-rend (charge initiale, filtrage, etc.).
 *
 * La fonction de comparaison custom ignore les changements de callbacks
 * (qui sont régénérés à chaque render parent) et compare uniquement
 * les valeurs métier qui influencent le rendu visuel.
 */
export const KanbanCardUI = memo(KanbanCardUIComponent, (prev, next) => {
  if (prev.task !== next.task) return false;
  if (prev.currentNow !== next.currentNow) return false;
  if (prev.variant !== next.variant) return false;
  if (prev.isOverlay !== next.isOverlay) return false;
  if (prev.isMyTask !== next.isMyTask) return false;
  if (prev.companyLogoUrl !== next.companyLogoUrl) return false;
  if (prev.style !== next.style) return false;
  return true;
});
KanbanCardUI.displayName = "KanbanCardUI";
