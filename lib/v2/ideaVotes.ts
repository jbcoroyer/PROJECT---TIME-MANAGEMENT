"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "../supabaseBrowser";
import { useCurrentUser } from "../useCurrentUser";

export type IdeaVotesBackend = "supabase" | "local";

const LOCAL_KEY = "v2-idea-votes";
const VOTES_EVENT = "v2-idea-votes-changed";

type VoteStore = Record<string, number>;

type IdeaVoteRow = {
  idea_id: string;
};

function readLocal(): VoteStore {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as VoteStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocal(store: VoteStore) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(VOTES_EVENT));
  } catch {
    /* ignoré */
  }
}

async function detectBackend(supabase: SupabaseClient): Promise<IdeaVotesBackend> {
  const { error } = await supabase.from("idea_votes").select("id").limit(1);
  return error ? "local" : "supabase";
}

function aggregateVotes(rows: IdeaVoteRow[]): VoteStore {
  const counts: VoteStore = {};
  for (const row of rows) {
    counts[row.idea_id] = (counts[row.idea_id] ?? 0) + 1;
  }
  return counts;
}

/** Votes partagés par idée (Supabase) avec repli localStorage si la table n'existe pas. */
export function useIdeaVotes() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const { user } = useCurrentUser();
  const [votes, setVotes] = useState<VoteStore>({});
  const [backend, setBackend] = useState<IdeaVotesBackend>("local");

  const reload = useCallback(async () => {
    const mode = await detectBackend(supabase);
    setBackend(mode);

    if (mode === "local") {
      setVotes(readLocal());
      return;
    }

    if (!user) {
      setVotes({});
      return;
    }

    const { data, error } = await supabase.from("idea_votes").select("idea_id");
    if (error) {
      console.warn("[IdeaVotes] load:", error);
      setVotes({});
      return;
    }
    setVotes(aggregateVotes((data ?? []) as IdeaVoteRow[]));
  }, [supabase, user]);

  useEffect(() => {
    queueMicrotask(() => {
      void reload();
    });
  }, [reload]);

  useEffect(() => {
    if (backend !== "local") return;
    const onChange = () => setVotes(readLocal());
    window.addEventListener(VOTES_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(VOTES_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [backend]);

  useEffect(() => {
    if (backend !== "supabase" || !user) return;

    const channel = supabase
      .channel("idea-votes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "idea_votes" },
        () => {
          void reload();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [backend, reload, supabase, user]);

  const setVote = useCallback(
    (id: string, delta: number) => {
      if (backend === "local") {
        setVotes((prev) => {
          const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) };
          writeLocal(next);
          return next;
        });
        return;
      }

      if (!user?.id) return;

      void (async () => {
        if (delta > 0) {
          const { error } = await supabase.from("idea_votes").upsert(
            { idea_id: id, user_id: user.id },
            { onConflict: "idea_id,user_id", ignoreDuplicates: true },
          );
          if (error) console.warn("[IdeaVotes] upsert:", error);
        } else if (delta < 0) {
          const { error } = await supabase
            .from("idea_votes")
            .delete()
            .eq("idea_id", id)
            .eq("user_id", user.id);
          if (error) console.warn("[IdeaVotes] delete:", error);
        }
        await reload();
      })();
    },
    [backend, reload, supabase, user],
  );

  return { votes, backend, setVote };
}
