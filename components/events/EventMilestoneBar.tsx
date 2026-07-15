"use client";

import { buildEventMilestones } from "../../lib/eventMilestones";
import type { EventRow } from "../../lib/eventTypes";
import type { Task } from "../../lib/types";

type Props = {
  event: EventRow;
  tasks: Task[];
  onFilterMilestone?: (dateIso: string) => void;
  activeFilterDate?: string | null;
};

export default function EventMilestoneBar(props: Props) {
  const { event, tasks, onFilterMilestone, activeFilterDate } = props;
  const milestones = buildEventMilestones(event.startDate, event.endDate, tasks);

  return (
    <div className="ui-surface rounded-[22px] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/50">
        Jalons de préparation
      </p>
      <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          {milestones.map((m) => {
            const active = activeFilterDate === m.dateIso;
            const tone =
              m.status === "late"
                ? "ui-pill ui-pill-danger border"
                : m.status === "current"
                  ? "border-[var(--line-strong)] bg-[var(--foreground)] text-[var(--accent-contrast)]"
                  : m.status === "done"
                    ? "ui-pill ui-pill-success border"
                    : "border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/70";
            return (
              <button
                key={m.offset}
                type="button"
                onClick={() => onFilterMilestone?.(m.dateIso)}
                className={[
                  "ui-transition flex w-[108px] shrink-0 flex-col rounded-xl border px-3 py-2.5 text-left",
                  tone,
                  active ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]" : "",
                ].join(" ")}
              >
                <p className="text-xs font-bold leading-tight">{m.label}</p>
                <p className="mt-1 text-[11px] leading-tight opacity-80">
                  {new Date(`${m.dateIso}T12:00:00`).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                {m.openTasksDueBy > 0 ? (
                  <p className="mt-1.5 text-[10px] font-semibold leading-tight">
                    {m.openTasksDueBy} tâche{m.openTasksDueBy > 1 ? "s" : ""}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
