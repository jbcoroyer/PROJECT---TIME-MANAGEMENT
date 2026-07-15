"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { BoardColumn } from "../lib/v2/boardColumns";
import { BOARD_COLUMN_PALETTE } from "../lib/v2/boardColumns";

export default function KanbanColumnHeader(props: {
  column: BoardColumn;
  count: number;
  editable?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onRename: (label: string) => Promise<void>;
  onColorChange: (color: string) => Promise<void>;
  onDeleteRequest: () => void;
}) {
  const {
    column,
    count,
    editable = true,
    dragHandleProps,
    onRename,
    onColorChange,
    onDeleteRequest,
  } = props;
  const [draftLabel, setDraftLabel] = useState(column.label);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraftLabel(column.label);
  }, [column.label]);

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
    <div className="mb-3 flex min-w-0 items-start gap-1 sm:gap-2" ref={menuRef}>
      <button
        type="button"
        className="mt-1 flex h-6 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-[color:var(--foreground)]/35 hover:bg-[var(--surface-soft)] hover:text-[color:var(--foreground)]/70 active:cursor-grabbing sm:h-7 sm:w-6"
        title="Déplacer la colonne"
        {...dragHandleProps}
      >
        <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div
          className="mb-2 h-1 rounded-full"
          style={{ backgroundColor: column.color }}
          aria-hidden
        />
        <div className="flex min-w-0 items-baseline gap-1 sm:gap-2">
          {editable ? (
            <div className="group/title relative min-w-0 flex-1">
              <label htmlFor={`col-label-${column.id}`} className="sr-only">
                Nom de la colonne — cliquez pour renommer
              </label>
              <div className="flex min-w-0 items-center gap-0.5 rounded-lg border border-dashed border-transparent px-1 py-0.5 transition-colors group-hover/title:border-[var(--line)] group-hover/title:bg-[var(--surface-soft)]/90 focus-within:border-[var(--accent)] focus-within:bg-[var(--surface-soft)] sm:gap-1 sm:px-1.5 sm:-mx-1.5">
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
                  className="ui-display min-w-0 flex-1 truncate cursor-text border-0 bg-transparent p-0 text-base leading-tight text-[var(--ink)] outline-none focus:ring-0 sm:text-[19px] lg:text-[21px]"
                />
                <Pencil
                  className="hidden h-3 w-3 shrink-0 text-[color:var(--foreground)]/30 transition-opacity group-hover/title:text-[var(--accent)] group-hover/title:opacity-100 group-focus-within/title:text-[var(--accent)] group-focus-within/title:opacity-100 opacity-60 sm:inline sm:h-3.5 sm:w-3.5"
                  aria-hidden
                />
              </div>
              <p className="pointer-events-none mt-0.5 hidden px-1.5 text-[9px] font-medium text-[color:var(--foreground)]/40 opacity-0 transition-opacity group-hover/title:opacity-100 group-focus-within/title:opacity-100 lg:block">
                Cliquez pour renommer
              </p>
            </div>
          ) : (
            <h3 className="ui-display min-w-0 flex-1 truncate text-base leading-tight text-[var(--ink)] sm:text-[19px] lg:text-[21px]">{column.label}</h3>
          )}
          <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] text-[var(--accent)] sm:text-[11px]">
            {String(count).padStart(2, "0")}
          </span>
        </div>
      </div>

      {editable ? (
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setMenuOpen((v) => !v);
            setPaletteOpen(false);
          }}
          className="ui-transition flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/55 hover:bg-[var(--surface)] sm:h-7 sm:w-7"
          title="Couleur et suppression de la colonne"
        >
          <MoreHorizontal className="h-4 w-4" />
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
    </div>
  );
}
