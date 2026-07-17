"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCurrentUser } from "../useCurrentUser";
import { getSupabaseBrowser } from "../supabaseBrowser";
import { toastError } from "../toast";
import type { Task } from "../types";
import { DONE_COLUMN_NAME } from "../workflowConstants";

export type KeyResult = {
  id: string;
  label: string;
  /** Domaine lié pour la progression auto (null = manuel). */
  linkedDomain: string | null;
  target: number;
  current: number;
};

export type Objective = {
  id: string;
  title: string;
  company: string | null;
  period: string;
  keyResults: KeyResult[];
};

export type OkrBackend = "supabase" | "local";

const LOCAL_KEY = "v2-okr-objectives";

type KeyResultRow = {
  id: string;
  objective_id: string;
  label: string;
  linked_domain: string | null;
  target: number | string;
  current: number | string;
};

type ObjectiveRow = {
  id: string;
  title: string;
  company: string | null;
  period: string;
  key_results?: KeyResultRow[] | null;
};

const OBJECTIVE_SELECT = `
  id,
  title,
  company,
  period,
  key_results (
    id,
    objective_id,
    label,
    linked_domain,
    target,
    current
  )
`;

function readLocal(): Objective[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? (JSON.parse(raw) as Objective[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Objective[]) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

function newId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function detectBackend(supabase: SupabaseClient): Promise<OkrBackend> {
  const { error } = await supabase.from("objectives").select("id").limit(1);
  return error ? "local" : "supabase";
}

function rowToKeyResult(row: KeyResultRow): KeyResult {
  return {
    id: row.id,
    label: row.label,
    linkedDomain: row.linked_domain,
    target: Number(row.target),
    current: Number(row.current),
  };
}

function rowToObjective(row: ObjectiveRow): Objective {
  const keyResults = (row.key_results ?? [])
    .map(rowToKeyResult)
    .sort((a, b) => a.id.localeCompare(b.id));
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    period: row.period,
    keyResults,
  };
}

function upsertObjective(prev: Objective[], objective: Objective): Objective[] {
  const idx = prev.findIndex((item) => item.id === objective.id);
  if (idx === -1) return [...prev, objective];
  const next = [...prev];
  next[idx] = objective;
  return next;
}

function upsertKeyResult(prev: Objective[], objectiveId: string, keyResult: KeyResult): Objective[] {
  return prev.map((objective) => {
    if (objective.id !== objectiveId) return objective;
    const idx = objective.keyResults.findIndex((kr) => kr.id === keyResult.id);
    if (idx === -1) {
      return { ...objective, keyResults: [...objective.keyResults, keyResult] };
    }
    const keyResults = [...objective.keyResults];
    keyResults[idx] = keyResult;
    return { ...objective, keyResults };
  });
}

export function useObjectives() {
  const { user } = useCurrentUser();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [backend, setBackend] = useState<OkrBackend>("local");
  const objectivesRef = useRef<Objective[]>([]);

  useEffect(() => {
    objectivesRef.current = objectives;
  }, [objectives]);

  const load = useCallback(async () => {
    const mode = await detectBackend(supabase);
    setBackend(mode);

    if (mode === "local") {
      setObjectives(readLocal());
      return;
    }

    if (!user) {
      setObjectives([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("objectives")
        .select(OBJECTIVE_SELECT)
        .order("id", { ascending: true });
      if (error) throw error;
      setObjectives((data ?? []).map((row: ObjectiveRow) => rowToObjective(row)));
    } catch (e) {
      console.warn("[OKR] load:", e);
      toastError("Impossible de charger les objectifs.");
      setObjectives([]);
    }
  }, [supabase, user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (backend !== "supabase" || !user) return;

    const channel = supabase
      .channel("okr-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "objectives" },
        (payload: { eventType?: string; old?: { id?: string }; new?: ObjectiveRow }) => {
          if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (!deletedId) return;
            setObjectives((prev) => prev.filter((objective) => objective.id !== deletedId));
            return;
          }
          if (!payload.new) return;
          setObjectives((prev) => {
            const existing = prev.find((item) => item.id === payload.new!.id);
            const mapped = rowToObjective({ ...(payload.new as ObjectiveRow), key_results: [] });
            return upsertObjective(prev, { ...mapped, keyResults: existing?.keyResults ?? [] });
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "key_results" },
        (payload: { eventType?: string; old?: { id?: string; objective_id?: string }; new?: KeyResultRow }) => {
          if (payload.eventType === "DELETE") {
            const krId = payload.old?.id;
            const objectiveId = payload.old?.objective_id;
            if (!krId || !objectiveId) return;
            setObjectives((prev) =>
              prev.map((objective) =>
                objective.id === objectiveId
                  ? { ...objective, keyResults: objective.keyResults.filter((kr) => kr.id !== krId) }
                  : objective,
              ),
            );
            return;
          }
          if (!payload.new) return;
          const keyResult = rowToKeyResult(payload.new);
          setObjectives((prev) => upsertKeyResult(prev, payload.new!.objective_id, keyResult));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [backend, supabase, user]);

  const addObjective = useCallback(
    (title: string, company: string | null, period: string) => {
      if (backend === "local") {
        setObjectives((prev) => {
          const next = [...prev, { id: newId("obj"), title, company, period, keyResults: [] }];
          writeLocal(next);
          return next;
        });
        return;
      }

      void (async () => {
        try {
          const { data, error } = await supabase
            .from("objectives")
            .insert({ title, company, period })
            .select("id, title, company, period")
            .single();
          if (error) throw error;
          const created = rowToObjective({ ...(data as ObjectiveRow), key_results: [] });
          setObjectives((prev) => upsertObjective(prev, created));
        } catch (e) {
          console.warn("[OKR] addObjective:", e);
          toastError("Impossible de créer l'objectif.");
        }
      })();
    },
    [backend, supabase],
  );

  const removeObjective = useCallback(
    (id: string) => {
      const previous = objectivesRef.current;
      setObjectives((prev) => {
        const next = prev.filter((objective) => objective.id !== id);
        if (backend === "local") writeLocal(next);
        return next;
      });

      if (backend === "local") return;

      void (async () => {
        try {
          const { error } = await supabase.from("objectives").delete().eq("id", id);
          if (error) throw error;
        } catch (e) {
          console.warn("[OKR] removeObjective:", e);
          setObjectives(previous);
          toastError("Impossible de supprimer l'objectif.");
        }
      })();
    },
    [backend, supabase],
  );

  const addKeyResult = useCallback(
    (objectiveId: string, kr: Omit<KeyResult, "id">) => {
      if (backend === "local") {
        setObjectives((prev) => {
          const next = prev.map((objective) =>
            objective.id === objectiveId
              ? { ...objective, keyResults: [...objective.keyResults, { ...kr, id: newId("kr") }] }
              : objective,
          );
          writeLocal(next);
          return next;
        });
        return;
      }

      void (async () => {
        try {
          const { data, error } = await supabase
            .from("key_results")
            .insert({
              objective_id: objectiveId,
              label: kr.label,
              linked_domain: kr.linkedDomain,
              target: kr.target,
              current: kr.current,
            })
            .select("id, objective_id, label, linked_domain, target, current")
            .single();
          if (error) throw error;
          const created = rowToKeyResult(data as KeyResultRow);
          setObjectives((prev) => upsertKeyResult(prev, objectiveId, created));
        } catch (e) {
          console.warn("[OKR] addKeyResult:", e);
          toastError("Impossible d'ajouter le résultat clé.");
        }
      })();
    },
    [backend, supabase],
  );

  const updateKeyResult = useCallback(
    (objectiveId: string, krId: string, patch: Partial<KeyResult>) => {
      const previous = objectivesRef.current;
      setObjectives((prev) => {
        const next = prev.map((objective) =>
          objective.id === objectiveId
            ? {
                ...objective,
                keyResults: objective.keyResults.map((kr) =>
                  kr.id === krId ? { ...kr, ...patch } : kr,
                ),
              }
            : objective,
        );
        if (backend === "local") writeLocal(next);
        return next;
      });

      if (backend === "local") return;

      void (async () => {
        try {
          const dbPatch: Record<string, unknown> = {};
          if (patch.label !== undefined) dbPatch.label = patch.label;
          if (patch.linkedDomain !== undefined) dbPatch.linked_domain = patch.linkedDomain;
          if (patch.target !== undefined) dbPatch.target = patch.target;
          if (patch.current !== undefined) dbPatch.current = patch.current;
          const { error } = await supabase.from("key_results").update(dbPatch).eq("id", krId);
          if (error) throw error;
        } catch (e) {
          console.warn("[OKR] updateKeyResult:", e);
          setObjectives(previous);
          toastError("Impossible de mettre à jour le résultat clé.");
        }
      })();
    },
    [backend, supabase],
  );

  const removeKeyResult = useCallback(
    (objectiveId: string, krId: string) => {
      const previous = objectivesRef.current;
      setObjectives((prev) => {
        const next = prev.map((objective) =>
          objective.id === objectiveId
            ? { ...objective, keyResults: objective.keyResults.filter((kr) => kr.id !== krId) }
            : objective,
        );
        if (backend === "local") writeLocal(next);
        return next;
      });

      if (backend === "local") return;

      void (async () => {
        try {
          const { error } = await supabase.from("key_results").delete().eq("id", krId);
          if (error) throw error;
        } catch (e) {
          console.warn("[OKR] removeKeyResult:", e);
          setObjectives(previous);
          toastError("Impossible de supprimer le résultat clé.");
        }
      })();
    },
    [backend, supabase],
  );

  return { objectives, backend, addObjective, removeObjective, addKeyResult, updateKeyResult, removeKeyResult };
}

/** Progression effective d'un KR : auto depuis les tâches si un domaine est lié, sinon current/target. */
export function keyResultProgress(kr: KeyResult, tasks: Task[]): { value: number; ratio: number; auto: boolean } {
  if (kr.linkedDomain) {
    const scope = tasks.filter((t) => !t.isArchived && !t.parentTaskId && t.domain === kr.linkedDomain);
    const done = scope.filter((t) => t.column === DONE_COLUMN_NAME).length;
    const target = kr.target > 0 ? kr.target : scope.length || 1;
    return { value: done, ratio: Math.min(1, done / target), auto: true };
  }
  const target = kr.target > 0 ? kr.target : 1;
  return { value: kr.current, ratio: Math.min(1, kr.current / target), auto: false };
}

export function objectiveProgress(obj: Objective, tasks: Task[]): number {
  if (obj.keyResults.length === 0) return 0;
  const total = obj.keyResults.reduce((acc, kr) => acc + keyResultProgress(kr, tasks).ratio, 0);
  return total / obj.keyResults.length;
}
