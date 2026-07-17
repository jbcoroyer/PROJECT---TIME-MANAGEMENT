"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "../supabaseBrowser";
import type { Priority } from "../types";

export type IntakeStatus = "triage" | "accepted" | "rejected";

export type IntakeRequest = {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  company: string;
  concern: string;
  supportFormat: string;
  deadline: string;
  budget: string;
  estimatedHours: number;
  requesterName: string;
  requesterService: string;
  priority: Priority;
  status: IntakeStatus;
  suggestedDomain: string | null;
  suggestedAssignee: string | null;
  linkedTaskId: string | null;
  decidedAt: string | null;
  intakeFormId: string | null;
};

type IntakeRow = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  company?: string | null;
  concern?: string | null;
  support_format?: string | null;
  deadline?: string | null;
  budget?: string | null;
  estimated_hours?: number | null;
  requester_name: string | null;
  requester_service: string | null;
  priority: string | null;
  status: string | null;
  suggested_domain: string | null;
  suggested_assignee: string | null;
  linked_task_id: string | null;
  decided_at: string | null;
  intake_form_id?: string | null;
};

function rowToRequest(row: IntakeRow): IntakeRequest {
  return {
    id: row.id,
    createdAt: row.created_at,
    title: row.title,
    description: row.description ?? "",
    company: row.company ?? "",
    concern: row.concern ?? "",
    supportFormat: row.support_format ?? "",
    deadline: row.deadline?.slice(0, 10) ?? "",
    budget: row.budget ?? "",
    estimatedHours: row.estimated_hours ?? 0,
    requesterName: row.requester_name ?? "",
    requesterService: row.requester_service ?? "",
    priority: (row.priority as Priority) ?? "Moyenne",
    status: (row.status as IntakeStatus) ?? "triage",
    suggestedDomain: row.suggested_domain,
    suggestedAssignee: row.suggested_assignee,
    linkedTaskId: row.linked_task_id,
    decidedAt: row.decided_at,
    intakeFormId: row.intake_form_id ?? null,
  };
}

export function suggestDomainFromText(text: string): string {
  const t = text.toLowerCase();
  if (/(print|impress|flyer|brochure|affiche|kakemono|roll)/.test(t)) return "🖨️ Print";
  if (/(insta|linkedin|facebook|post|réseau|reseau|social|story|reel)/.test(t)) return "🖥️ Digitale";
  if (/(presse|communiqu|journalist|média|media|rp )/.test(t)) return "📰 Presse";
  if (/(salon|stand|event|événement|evenement|expo|foire)/.test(t)) return "🎟️ Event";
  if (/(client|devis|commande)/.test(t)) return "📮 Client";
  return "🌎 General";
}

export function useIntakeRequests(formId?: string | null) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [requests, setRequests] = useState<IntakeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("intake_requests").select("*").order("created_at", { ascending: false });
    if (formId) {
      query = query.eq("intake_form_id", formId);
    }
    const { data, error } = await query;
    if (error) {
      console.error("intake_requests load failed", error);
      setRequests([]);
    } else {
      setRequests(((data ?? []) as IntakeRow[]).map(rowToRequest));
    }
    setLoading(false);
  }, [supabase, formId]);

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, [reload]);

  const updateRequest = useCallback(
    async (id: string, patch: Partial<IntakeRequest>) => {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      const dbPatch: Record<string, unknown> = {};
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.linkedTaskId !== undefined) dbPatch.linked_task_id = patch.linkedTaskId;
      if (patch.decidedAt !== undefined) dbPatch.decided_at = patch.decidedAt;
      if (patch.suggestedDomain !== undefined) dbPatch.suggested_domain = patch.suggestedDomain;
      if (patch.suggestedAssignee !== undefined) dbPatch.suggested_assignee = patch.suggestedAssignee;
      if (patch.budget !== undefined) dbPatch.budget = patch.budget;
      if (patch.estimatedHours !== undefined) dbPatch.estimated_hours = patch.estimatedHours;
      if (patch.priority !== undefined) dbPatch.priority = patch.priority;
      if (Object.keys(dbPatch).length > 0) {
        const { error } = await supabase.from("intake_requests").update(dbPatch).eq("id", id);
        if (error) console.error("intake_requests update failed", error);
      }
    },
    [supabase],
  );

  return { requests, loading, reload, updateRequest };
}

export type SubmitIntakeInput = {
  title: string;
  expectedSupport: string;
  supportFormat: string;
  company: string;
  deadline: string;
  description: string;
  requesterName?: string;
  requesterService?: string;
};

export async function submitIntakeRequest(input: SubmitIntakeInput): Promise<{ ok: boolean }> {
  const supabase = getSupabaseBrowser();
  const domainText = `${input.title} ${input.expectedSupport} ${input.supportFormat} ${input.description}`;
  const suggestedDomain = suggestDomainFromText(domainText);

  const { error } = await supabase.from("intake_requests").insert({
    title: input.title,
    description: input.description,
    company: input.company,
    concern: input.expectedSupport,
    support_format: input.supportFormat,
    deadline: input.deadline,
    budget: "",
    estimated_hours: 0,
    requester_name: input.requesterName ?? "",
    requester_service: input.requesterService ?? "",
    priority: "Moyenne",
    status: "triage",
    suggested_domain: suggestedDomain,
  });

  return { ok: !error };
}
