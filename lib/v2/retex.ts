"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "../supabaseBrowser";

export type RetexInputs = {
  highlights: string;
  improvements: string;
  followUps: string;
};

export const EMPTY_RETEX: RetexInputs = {
  highlights: "",
  improvements: "",
  followUps: "",
};

type RetexRow = {
  event_id: string;
  highlights: string;
  improvements: string;
  follow_ups: string;
};

function rowToInputs(row: RetexRow): RetexInputs {
  return {
    highlights: row.highlights ?? "",
    improvements: row.improvements ?? "",
    followUps: row.follow_ups ?? "",
  };
}

/** Persistance Supabase des saisies RETEX par événement. */
export function useRetexInputs(eventId: string | null) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [inputs, setInputs] = useState<RetexInputs>(EMPTY_RETEX);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setInputs(EMPTY_RETEX);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("event_retex")
        .select("event_id, highlights, improvements, follow_ups")
        .eq("event_id", eventId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("event_retex load failed", error);
        setInputs(EMPTY_RETEX);
      } else {
        setInputs(data ? rowToInputs(data as RetexRow) : EMPTY_RETEX);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, supabase]);

  const persist = useCallback(
    async (next: RetexInputs) => {
      if (!eventId) return;
      const payload = {
        event_id: eventId,
        highlights: next.highlights,
        improvements: next.improvements,
        follow_ups: next.followUps,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("event_retex").upsert(payload, { onConflict: "event_id" });
      if (error) console.error("event_retex save failed", error);
    },
    [eventId, supabase],
  );

  const update = useCallback(
    (patch: Partial<RetexInputs>) => {
      setInputs((prev) => {
        const next = { ...prev, ...patch };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  return { inputs, update, loading };
}

export function buildRetexDraft(input: {
  eventName: string;
  location: string;
  taskProgressPct: number;
  inputs: RetexInputs;
}): string {
  const { inputs } = input;
  const lines = [
    `# RETEX — ${input.eventName}${input.location ? ` (${input.location})` : ""}`,
    "",
    "## Contexte",
    `- Avancement des tâches : ${input.taskProgressPct} %`,
    "",
    "## Points forts",
    inputs.highlights.trim() ? inputs.highlights.trim() : "- …",
    "",
    "## À améliorer",
    inputs.improvements.trim() ? inputs.improvements.trim() : "- …",
    "",
    "## Actions de suivi",
    inputs.followUps.trim() ? inputs.followUps.trim() : "- …",
  ];
  return lines.join("\n");
}
