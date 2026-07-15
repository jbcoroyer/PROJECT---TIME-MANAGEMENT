"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "../supabaseBrowser";
import { toastError } from "../toast";

export type BoardFieldType =
  | "text"
  | "number"
  | "select"
  | "status"
  | "date"
  | "person"
  | "checkbox"
  | "url"
  | "relation";

export type RelationEntity = "companies" | "events" | "domains";

export type FieldOption = {
  id: string;
  label: string;
  color?: string;
};

export type BoardFieldConfig = {
  options?: FieldOption[];
  entity?: RelationEntity;
  multiple?: boolean;
};

export type BoardField = {
  id: string;
  boardId: string;
  organizationId: string;
  key: string;
  label: string;
  type: BoardFieldType;
  position: number;
  config: BoardFieldConfig;
};

export const BOARD_FIELD_TYPE_LABELS: Record<BoardFieldType, string> = {
  text: "Texte",
  number: "Nombre",
  select: "Liste déroulante",
  status: "Statut",
  date: "Date",
  person: "Personne",
  checkbox: "Case à cocher",
  url: "Lien",
  relation: "Relation",
};

const BOARD_FIELD_SELECT =
  "id, board_id, organization_id, key, label, type, position, config";

type BoardFieldRow = {
  id: string;
  board_id: string;
  organization_id: string;
  key: string;
  label: string;
  type: BoardFieldType;
  position: number;
  config: BoardFieldConfig | null;
};

function slugifyKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseConfig(raw: unknown): BoardFieldConfig {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const config: BoardFieldConfig = {};
  if (Array.isArray(obj.options)) {
    config.options = obj.options
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const o = item as Record<string, unknown>;
        return {
          id: String(o.id ?? ""),
          label: String(o.label ?? ""),
          color: typeof o.color === "string" ? o.color : undefined,
        };
      })
      .filter((o) => o.id && o.label);
  }
  if (obj.entity === "companies" || obj.entity === "events" || obj.entity === "domains") {
    config.entity = obj.entity;
  }
  if (typeof obj.multiple === "boolean") config.multiple = obj.multiple;
  return config;
}

function rowToBoardField(row: BoardFieldRow): BoardField {
  return {
    id: row.id,
    boardId: row.board_id,
    organizationId: row.organization_id,
    key: row.key,
    label: row.label,
    type: row.type,
    position: row.position,
    config: parseConfig(row.config),
  };
}

function defaultConfigForType(type: BoardFieldType): BoardFieldConfig {
  if (type === "select" || type === "status") return { options: [] };
  if (type === "relation") return { entity: "companies", multiple: false };
  if (type === "person") return { multiple: false };
  return {};
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: string }).message;
    if (msg?.trim()) return msg;
  }
  return fallback;
}

function sortFields(fields: BoardField[]): BoardField[] {
  return [...fields].sort(
    (a, b) => a.position - b.position || a.label.localeCompare(b.label, "fr"),
  );
}

async function uniqueKeyForBoard(boardId: string, label: string): Promise<string> {
  const base = slugifyKey(label) || "champ";
  const existing = await listByBoard(boardId);
  const keys = new Set(existing.map((f) => f.key));
  if (!keys.has(base)) return base;
  let i = 2;
  while (keys.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export async function listByBoard(boardId: string): Promise<BoardField[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("board_fields")
    .select(BOARD_FIELD_SELECT)
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as BoardFieldRow[]).map(rowToBoardField);
}

export async function create(
  boardId: string,
  input: { label: string; type: BoardFieldType; config?: BoardFieldConfig },
): Promise<BoardField> {
  const trimmed = input.label.trim();
  if (!trimmed) throw new Error("Le libellé du champ est obligatoire.");

  const supabase = getSupabaseBrowser();
  const existing = await listByBoard(boardId);
  const nextPosition = existing.reduce((max, f) => Math.max(max, f.position), -1) + 1;
  const key = await uniqueKeyForBoard(boardId, trimmed);
  const config = input.config ?? defaultConfigForType(input.type);

  const { data, error } = await supabase
    .from("board_fields")
    .insert({
      board_id: boardId,
      key,
      label: trimmed,
      type: input.type,
      position: nextPosition,
      config,
    })
    .select(BOARD_FIELD_SELECT)
    .single();

  if (error) throw error;
  return rowToBoardField(data as BoardFieldRow);
}

export async function update(
  id: string,
  patch: { label?: string; config?: BoardFieldConfig; position?: number },
): Promise<void> {
  if ("type" in patch) {
    throw new Error("Le type d'un champ ne peut pas être modifié. Supprimez et recréez le champ.");
  }

  const dbPatch: Record<string, unknown> = {};
  if (patch.label !== undefined) {
    const trimmed = patch.label.trim();
    if (!trimmed) throw new Error("Le libellé du champ est obligatoire.");
    dbPatch.label = trimmed;
  }
  if (patch.config !== undefined) dbPatch.config = patch.config;
  if (patch.position !== undefined) dbPatch.position = patch.position;
  if (Object.keys(dbPatch).length === 0) return;

  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("board_fields").update(dbPatch).eq("id", id);
  if (error) throw error;
}

export async function reorder(boardId: string, orderedIds: string[]): Promise<void> {
  const supabase = getSupabaseBrowser();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("board_fields").update({ position: index }).eq("id", id).eq("board_id", boardId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function remove(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("board_fields").delete().eq("id", id);
  if (error) throw error;
}

export function useBoardFields(boardId: string | null) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [fields, setFields] = useState<BoardField[]>([]);
  const [loading, setLoading] = useState(true);
  const fieldsRef = useRef<BoardField[]>([]);

  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  const load = useCallback(async () => {
    if (!boardId) {
      setFields([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const rows = await listByBoard(boardId);
      setFields(sortFields(rows));
    } catch (e) {
      toastError(getErrorMessage(e, "Impossible de charger les champs du tableau."));
      setFields([]);
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
      .channel(`board-fields-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_fields",
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

  const createField = useCallback(
    async (input: { label: string; type: BoardFieldType; config?: BoardFieldConfig }) => {
      if (!boardId) throw new Error("Tableau introuvable.");
      const previous = fieldsRef.current;
      const tempId = `temp-${Date.now()}`;
      const optimistic: BoardField = {
        id: tempId,
        boardId,
        organizationId: previous[0]?.organizationId ?? "",
        key: slugifyKey(input.label) || "champ",
        label: input.label.trim(),
        type: input.type,
        position: previous.length,
        config: input.config ?? defaultConfigForType(input.type),
      };
      setFields(sortFields([...previous, optimistic]));
      try {
        const created = await create(boardId, input);
        setFields((prev) => sortFields(prev.map((f) => (f.id === tempId ? created : f))));
        return created;
      } catch (e) {
        setFields(previous);
        throw e;
      }
    },
    [boardId],
  );

  const updateField = useCallback(
    async (id: string, patch: { label?: string; config?: BoardFieldConfig }) => {
      const previous = fieldsRef.current;
      setFields((prev) =>
        sortFields(
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
                  ...(patch.config !== undefined ? { config: patch.config } : {}),
                }
              : f,
          ),
        ),
      );
      try {
        await update(id, patch);
      } catch (e) {
        setFields(previous);
        throw e;
      }
    },
    [],
  );

  const reorderFields = useCallback(
    async (orderedIds: string[]) => {
      if (!boardId) return;
      const previous = fieldsRef.current;
      const byId = new Map(previous.map((f) => [f.id, f]));
      const reordered = orderedIds
        .map((id, index) => {
          const field = byId.get(id);
          return field ? { ...field, position: index } : null;
        })
        .filter((f): f is BoardField => f !== null);
      setFields(reordered);
      try {
        await reorder(boardId, orderedIds);
      } catch (e) {
        setFields(previous);
        throw e;
      }
    },
    [boardId],
  );

  const removeField = useCallback(async (id: string) => {
    const previous = fieldsRef.current;
    setFields((prev) => prev.filter((f) => f.id !== id));
    try {
      await remove(id);
    } catch (e) {
      setFields(previous);
      throw e;
    }
  }, []);

  return {
    fields,
    loading,
    reload: load,
    createField,
    updateField,
    reorderFields,
    removeField,
  };
}
