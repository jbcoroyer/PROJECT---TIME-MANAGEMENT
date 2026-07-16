"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { BoardColumn } from "../lib/v2/boardColumns";
import { BOARD_COLUMN_PALETTE } from "../lib/v2/boardColumns";

const CTRL =
  "ui-transition inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/55 hover:bg-[var(--surface)] hover:text-[color:var(--foreground)]/80";

export default function KanbanColumnHeader(props: {
  column: BoardColumn;
  count: number;
  editable?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onRename: (label: string) => Promise<void>;
  onColorChange: (color: string) => Promise<void>;
  onDeleteRequest: () => void;
  onAddTask?: () => void;
}) {
  const {
    column,
    count,
    editable = true,
    dragHandleProps,
    onRename,
    onColorChange,
    onDeleteRequest,
    onAddTask,
  } = props;
  const [draftLabel, setDraftLabel] = useState(column.label);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [prevColumnLabel, setPrevColumnLabel] = useState(column.label);
  if (column.label !== prevColumnLabel) {
    setPrevColumnLabel(column.label);
    setDraftLabel(column.label);
  }

  useEffect(() => {
    if (!menuOpen && !paletteOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPaletteOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen, paletteOpen]);

  const commitRename = async () => {
    const next = draftLabel.trim();
    if (!next || next === column.label) {
      setDraftLabel(column.label);
      return;
    }
    await onRename(next);
  };

  return (
    <div className="mb-3 flex min-w-0 items-center gap-1.5" ref={menuRef}>
      {editable ? (
        <button
          type="button"
          className={`${CTRL} cursor-grab touch-none active:cursor-grabbing`}
          title="Déplacer la colonne"
          {...dragHandleProps}
        >
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}

      <div
        className="h-7 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: column.color }}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        {editable ? (
          <div className="group/title relative min-w-0">
            <label htmlFor={`col-label-${column.id}`} className="sr-only">
              Nom de la colonne — cliquez pour renommer
            </label>
            <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-0 transition-colors group-hover/title:border-[var(--line)] group-hover/title:bg-[var(--surface-soft)]/90 focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-soft)]">
              <input
                id={`col-label-${column.id}`}
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                onBlur={() => void commitRename()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void commitRename();
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === "Escape") {
                    setDraftLabel(column.label);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                title="Cliquez pour renommer cette colonne"
                placeholder="Nom de la colonne"
                className="ui-display min-w-0 flex-1 truncate cursor-text border-0 bg-transparent p-0 text-[17px] leading-7 text-[var(--ink)] outline-none focus:ring-0 sm:text-[18px]"
              />
              <Pencil
                className="h-3.5 w-3.5 shrink-0 text-[color:var(--foreground)]/35 opacity-70 transition-colors group-hover/title:text-[var(--accent)] group-focus-within/title:text-[var(--accent)]"
                aria-hidden
              />
            </div>
          </div>
        ) : (
          <h3 className="ui-display truncate px-1.5 text-[17px] leading-7 text-[var(--ink)] sm:text-[18px]">
            {column.label}
          </h3>
        )}
      </div>

      <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-soft))] px-1.5 font-[family-name:var(--font-mono)] text-[11px] font-semibold tabular-nums text-[var(--accent)]">
        {String(count).padStart(2, "0")}
      </span>

      {editable ? (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setPaletteOpen(false);
            }}
            className={CTRL}
            title="Couleur et suppression de la colonne"
          >
            <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-8 z-20 min-w-[180px] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setPaletteOpen((v) => !v);
                }}
                className="ui-transition w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
              >
                Couleur
              </button>
              {paletteOpen ? (
                <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                  {BOARD_COLUMN_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      onClick={() => {
                        void onColorChange(color);
                        setPaletteOpen(false);
                        setMenuOpen(false);
                      }}
                      className={[
                        "h-6 w-6 rounded-full border-2",
                        column.color === color ? "border-[var(--foreground)]" : "border-transparent",
                      ].join(" ")}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteRequest();
                }}
                className="ui-transition flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {onAddTask ? (
        <button
          type="button"
          onClick={onAddTask}
          className={CTRL}
          title="Ajouter une tâche dans cette colonne"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
