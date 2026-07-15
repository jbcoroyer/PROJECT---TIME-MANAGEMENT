"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "../supabaseBrowser";
import { toastError } from "../toast";

export type BoardColumn = {
  id: string;
  boardId: string;
  organizationId: string;
  label: string;
  color: string;
  position: number;
  wipLimit: number | null;
  isDone: boolean;
};

export const BOARD_COLUMN_PALETTE = [
  "#94a3b8",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#a855f7",
  "#ec4899",
] as const;

const BOARD_COLUMN_SELECT =
  "id, board_id, organization_id, label, color, position, wip_limit, is_done";

type BoardColumnRow = {
  id: string;
  board_id: string;
  organization_id: string;
  label: string;
  color: string;
  position: number;
  wip_limit: number | null;
  is_done: boolean;
};

function rowToBoardColumn(row: BoardColumnRow): BoardColumn {
  return {
    id: row.id,
    boardId: row.board_id,
    organizationId: row.organization_id,
    label: row.label,
    color: row.color,
    position: row.position,
    wipLimit: row.wip_limit,
    isDone: row.is_done,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: string }).message;
    if (msg?.trim()) return msg;
  }
  return fallback;
}

export async function getDefaultBoardId(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("boards")
    .select("id")
    .eq("name", "Espace principal")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function listByBoard(boardId: string): Promise<BoardColumn[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("board_columns")
    .select(BOARD_COLUMN_SELECT)
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as BoardColumnRow[]).map(rowToBoardColumn);
}

export async function create(
  boardId: string,
  label: string,
  color: string = BOARD_COLUMN_PALETTE[0],
): Promise<BoardColumn> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Le nom de colonne est obligatoire.");

  const supabase = getSupabaseBrowser();
  const existing = await listByBoard(boardId);
  const nextPosition =
    existing.reduce((max, col) => Math.max(max, col.position), -1) + 1;

  const { data, error } = await supabase
    .from("board_columns")
    .insert({
      board_id: boardId,
      label: trimmed,
      color,
      position: nextPosition,
      is_done: trimmed === "Terminé",
    })
    .select(BOARD_COLUMN_SELECT)
    .single();

  if (error) throw error;
  return rowToBoardColumn(data as BoardColumnRow);
}

export async function rename(id: string, label: string): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Le nom de colonne est obligatoire.");

  const supabase = getSupabaseBrowser();
  const { error } = await supabase.rpc("rename_board_column", {
    p_column_id: id,
    p_new_label: trimmed,
  });
  if (error) throw error;
}

export async function setColor(id: string, color: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("board_columns").update({ color }).eq("id", id);
  if (error) throw error;
}

export async function reorder(boardId: string, orderedIds: string[]): Promise<void> {
  const supabase = getSupabaseBrowser();
  const updates = orderedIds.map((id, index) =>
    supabase.from("board_columns").update({ position: index }).eq("id", id).eq("board_id", boardId),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function countTasksInColumn(column: BoardColumn): Promise<number> {
  const supabase = getSupabaseBrowser();
  const { count, error } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("board_id", column.boardId)
    .eq("column_id", column.label);
  if (error) throw error;
  return count ?? 0;
}

export async function remove(
  id: string,
  options?: { reassignToColumnId?: string },
): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { data: columnRow, error: colError } = await supabase
    .from("board_columns")
    .select(BOARD_COLUMN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (colError) throw colError;
  if (!columnRow) throw new Error("Colonne introuvable.");

  const column = rowToBoardColumn(columnRow as BoardColumnRow);
  const taskCount = await countTasksInColumn(column);

  if (taskCount > 0 && !options?.reassignToColumnId) {
    throw new Error(
      `Impossible de supprimer « ${column.label} » : ${taskCount} tâche(s) présente(s). Choisissez une colonne de réaffectation.`,
    );
  }

  if (taskCount > 0 && options?.reassignToColumnId) {
    const { error } = await supabase.rpc("reassign_and_delete_board_column", {
      p_column_id: id,
      p_target_column_id: options.reassignToColumnId,
    });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("board_columns").delete().eq("id", id);
  if (error) throw error;
}

function sortColumns(cols: BoardColumn[]): BoardColumn[] {
  return [...cols].sort((a, b) => a.position - b.position || a.label.localeCompare(b.label, "fr"));
}

export function useBoardColumns(boardId: string | null) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const columnsRef = useRef<BoardColumn[]>([]);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const load = useCallback(async () => {
    if (!boardId) {
      setColumns([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const rows = await listByBoard(boardId);
      setColumns(sortColumns(rows));
    } catch (e) {
      toastError(getErrorMessage(e, "Impossible de charger les colonnes du tableau."));
      setColumns([]);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`board-columns-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_columns",
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [boardId, load, supabase]);

  const createColumn = useCallback(
    async (label: string, color?: string) => {
      if (!boardId) throw new Error("Tableau introuvable.");
      const optimisticLabel = label.trim();
      const previous = columnsRef.current;
      const tempId = `temp-${Date.now()}`;
      const optimistic: BoardColumn = {
        id: tempId,
        boardId,
        organizationId: previous[0]?.organizationId ?? "",
        label: optimisticLabel,
        color: color ?? BOARD_COLUMN_PALETTE[0],
        position: previous.length,
        wipLimit: null,
        isDone: optimisticLabel === "Terminé",
      };
      setColumns(sortColumns([...previous, optimistic]));
      try {
        const created = await create(boardId, optimisticLabel, color);
        setColumns((prev) => sortColumns(prev.map((c) => (c.id === tempId ? created : c))));
        return created;
      } catch (e) {
        setColumns(previous);
        throw e;
      }
    },
    [boardId],
  );

  const renameColumn = useCallback(async (id: string, label: string) => {
    const previous = columnsRef.current;
    const trimmed = label.trim();
    setColumns((prev) =>
      sortColumns(prev.map((c) => (c.id === id ? { ...c, label: trimmed } : c))),
    );
    try {
      await rename(id, trimmed);
    } catch (e) {
      setColumns(previous);
      throw e;
    }
  }, []);

  const setColumnColor = useCallback(async (id: string, color: string) => {
    const previous = columnsRef.current;
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, color } : c)));
    try {
      await setColor(id, color);
    } catch (e) {
      setColumns(previous);
      throw e;
    }
  }, []);

  const reorderColumns = useCallback(
    async (orderedIds: string[]) => {
      if (!boardId) return;
      const previous = columnsRef.current;
      const byId = new Map(previous.map((c) => [c.id, c]));
      const reordered = orderedIds
        .map((id, index) => {
          const col = byId.get(id);
          return col ? { ...col, position: index } : null;
        })
        .filter((c): c is BoardColumn => c !== null);
      setColumns(reordered);
      try {
        await reorder(boardId, orderedIds);
      } catch (e) {
        setColumns(previous);
        throw e;
      }
    },
    [boardId],
  );

  const removeColumn = useCallback(
    async (id: string, reassignToColumnId?: string) => {
      const previous = columnsRef.current;
      setColumns((prev) => prev.filter((c) => c.id !== id));
      try {
        await remove(id, reassignToColumnId ? { reassignToColumnId } : undefined);
      } catch (e) {
        setColumns(previous);
        throw e;
      }
    },
    [],
  );

  return {
    columns,
    loading,
    reload: load,
    createColumn,
    renameColumn,
    setColumnColor,
    reorderColumns,
    removeColumn,
    countTasksInColumn,
  };
}
