"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "../supabaseBrowser";
import { toastError } from "../toast";
import type { BoardField } from "./boardFields";

export type CustomFieldsMap = Record<string, unknown>;

function parseCustomFields(raw: unknown): CustomFieldsMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...(raw as Record<string, unknown>) };
}

export function getValue(values: CustomFieldsMap, field: BoardField): unknown {
  return values[field.key];
}

export async function loadForTask(taskId: string): Promise<CustomFieldsMap> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("tasks")
    .select("custom_fields")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw error;
  return parseCustomFields((data as { custom_fields?: unknown } | null)?.custom_fields);
}

export async function loadBoardIdForTask(taskId: string): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("tasks")
    .select("board_id")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw error;
  const boardId = (data as { board_id?: string | null } | null)?.board_id;
  return boardId ?? null;
}

export async function setValue(
  taskId: string,
  field: BoardField,
  value: unknown,
): Promise<CustomFieldsMap> {
  const current = await loadForTask(taskId);
  const next = { ...current, [field.key]: value };
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("tasks")
    .update({ custom_fields: next })
    .eq("id", taskId);
  if (error) throw error;
  return next;
}

export async function mergeCustomFields(
  taskId: string,
  patch: CustomFieldsMap,
): Promise<CustomFieldsMap> {
  const current = await loadForTask(taskId);
  const next = { ...current, ...patch };
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("tasks")
    .update({ custom_fields: next })
    .eq("id", taskId);
  if (error) throw error;
  return next;
}

export async function attachCustomFieldsAfterCreate(params: {
  projectName: string;
  company: string;
  fields: CustomFieldsMap;
}): Promise<void> {
  if (Object.keys(params.fields).length === 0) return;

  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, custom_fields")
    .eq("project_name", params.projectName.trim())
    .eq("company", params.company)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  const taskId = String((data as { id: string }).id);
  const existing = parseCustomFields((data as { custom_fields?: unknown }).custom_fields);
  const next = { ...existing, ...params.fields };
  const { error: updateError } = await supabase
    .from("tasks")
    .update({ custom_fields: next })
    .eq("id", taskId);
  if (updateError) throw updateError;
}

export function useTaskCustomFields(taskId: string | null) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [values, setValues] = useState<CustomFieldsMap>({});
  const [loading, setLoading] = useState(false);
  const valuesRef = useRef<CustomFieldsMap>({});

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const load = useCallback(async () => {
    if (!taskId) {
      setValues({});
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const loaded = await loadForTask(taskId);
      setValues(loaded);
    } catch {
      setValues({});
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task-custom-fields-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `id=eq.${taskId}`,
        },
        (payload: { new?: { custom_fields?: unknown } }) => {
          if (!payload.new) return;
          setValues(parseCustomFields(payload.new.custom_fields));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, taskId]);

  const updateValue = useCallback(
    async (field: BoardField, value: unknown) => {
      if (!taskId) return;
      const previous = valuesRef.current;
      const optimistic = { ...previous, [field.key]: value };
      setValues(optimistic);
      try {
        const next = await setValue(taskId, field, value);
        setValues(next);
      } catch (e) {
        setValues(previous);
        toastError("Impossible de sauvegarder le champ personnalisé.");
        throw e;
      }
    },
    [taskId],
  );

  return {
    values,
    loading,
    reload: load,
    updateValue,
    setValues,
  };
}
