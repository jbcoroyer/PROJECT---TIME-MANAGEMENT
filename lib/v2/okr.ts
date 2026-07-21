"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCurrentUser } from "../useCurrentUser";
import { getSupabaseBrowser } from "../supabaseBrowser";
import { toastError } from "../toast";
import type { Task } from "../types";
import { DONE_COLUMN_NAME } from "../workflowConstants";

export type ObjectiveScope = "team" | "personal";

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
  description: string | null;
  scope: ObjectiveScope;
  ownerUserId: string | null;
  dueDate: string | null;
  /** Conservé pour compatibilité (période affichée ou trimestre). */
  period: string;
  company: string | null;
  createdAt: string;
  keyResults: KeyResult[];
};

export type CreateObjectiveInput = {
  title: string;
  scope: ObjectiveScope;
  dueDate: string | null;
  description?: string | null;
};

export type UpdateObjectiveInput = Partial<
  Pick<Objective, "title" | "description" | "dueDate">
>;

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
  description?: string | null;
  scope?: ObjectiveScope | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  company: string | null;
  period: string;
  created_at?: string | null;
  key_results?: KeyResultRow[] | null;
};

const OBJECTIVE_SELECT = `
  id,
  title,
  description,
  scope,
  owner_user_id,
  due_date,
  company,
  period,
  created_at,
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

function periodFromDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  const d = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  return `T${quarter} ${d.getFullYear()}`;
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
    description: row.description ?? null,
    scope: row.scope === "personal" ? "personal" : "team",
    ownerUserId: row.owner_user_id ?? null,
    dueDate: row.due_date ?? null,
    company: row.company,
    period: row.period,
    createdAt: row.created_at ?? new Date().toISOString(),
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

export function canDeleteObjective(objective: Objective, userId: string | null, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (objective.scope === "personal" && objective.ownerUserId === userId) return true;
  return false;
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
        .order("created_at", { ascending: false });
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
    (input: CreateObjectiveInput) => {
      const period = periodFromDueDate(input.dueDate) || "En cours";
      const ownerUserId = input.scope === "personal" ? user?.id ?? null : null;

      if (backend === "local") {
        setObjectives((prev) => {
          const next = [
            ...prev,
            {
              id: newId("obj"),
              title: input.title,
              description: input.description ?? null,
              scope: input.scope,
              ownerUserId,
              dueDate: input.dueDate,
              company: null,
              period,
              createdAt: new Date().toISOString(),
              keyResults: [],
            },
          ];
          writeLocal(next);
          return next;
        });
        return;
      }

      if (!user) return;

      void (async () => {
        try {
          const { data, error } = await supabase
            .from("objectives")
            .insert({
              title: input.title,
              description: input.description ?? null,
              scope: input.scope,
              owner_user_id: ownerUserId,
              due_date: input.dueDate,
              company: null,
              period,
              created_by_user_id: user.id,
            })
            .select("id, title, description, scope, owner_user_id, due_date, company, period, created_at")
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
    [backend, supabase, user],
  );

  const updateObjective = useCallback(
    (id: string, patch: UpdateObjectiveInput) => {
      const previous = objectivesRef.current;
      setObjectives((prev) => {
        const next = prev.map((objective) => {
          if (objective.id !== id) return objective;
          const dueDate = patch.dueDate !== undefined ? patch.dueDate : objective.dueDate;
          return {
            ...objective,
            ...patch,
            dueDate,
            period: patch.dueDate !== undefined ? periodFromDueDate(dueDate) || objective.period : objective.period,
          };
        });
        if (backend === "local") writeLocal(next);
        return next;
      });

      if (backend === "local") return;

      void (async () => {
        try {
          const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (patch.title !== undefined) dbPatch.title = patch.title;
          if (patch.description !== undefined) dbPatch.description = patch.description;
          if (patch.dueDate !== undefined) {
            dbPatch.due_date = patch.dueDate;
            dbPatch.period = periodFromDueDate(patch.dueDate) || "En cours";
          }
          const { error } = await supabase.from("objectives").update(dbPatch).eq("id", id);
          if (error) throw error;
        } catch (e) {
          console.warn("[OKR] updateObjective:", e);
          setObjectives(previous);
          toastError("Impossible de mettre à jour l'objectif.");
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
      const safeTarget = kr.linkedDomain ? Math.max(1, kr.target) : Math.max(1, kr.target || 1);

      if (backend === "local") {
        setObjectives((prev) => {
          const next = prev.map((objective) =>
            objective.id === objectiveId
              ? {
                  ...objective,
                  keyResults: [...objective.keyResults, { ...kr, id: newId("kr"), target: safeTarget }],
                }
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
              target: safeTarget,
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

  return {
    objectives,
    backend,
    addObjective,
    updateObjective,
    removeObjective,
    addKeyResult,
    updateKeyResult,
    removeKeyResult,
  };
}

/** Progression effective d'un KR : auto depuis les tâches si un domaine est lié, sinon current/target. */
export function keyResultProgress(kr: KeyResult, tasks: Task[]): { value: number; ratio: number; auto: boolean } {
  if (kr.linkedDomain) {
    const scope = tasks.filter((t) => !t.isArchived && !t.parentTaskId && t.domain === kr.linkedDomain);
    const done = scope.filter((t) => t.column === DONE_COLUMN_NAME).length;
    const target = Math.max(1, kr.target);
    return { value: done, ratio: Math.min(1, done / target), auto: true };
  }
  const target = Math.max(1, kr.target);
  return { value: kr.current, ratio: Math.min(1, kr.current / target), auto: false };
}

export function objectiveProgress(obj: Objective, tasks: Task[]): number {
  if (obj.keyResults.length === 0) return 0;
  const total = obj.keyResults.reduce((acc, kr) => acc + keyResultProgress(kr, tasks).ratio, 0);
  return total / obj.keyResults.length;
}

export function objectiveDueStatus(
  obj: Objective,
  tasks: Task[],
  now = new Date(),
): "none" | "upcoming" | "overdue" | "done" {
  const ratio = objectiveProgress(obj, tasks);
  if (ratio >= 1) return "done";
  if (!obj.dueDate) return "none";
  const due = new Date(`${obj.dueDate}T23:59:59`);
  if (Number.isNaN(due.getTime())) return "none";
  if (due < now) return "overdue";
  const daysLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysLeft <= 14) return "upcoming";
  return "none";
}
