"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { ideaFromRow, ideaToClient, type StockIdeaDto } from "./stockIdeasApi";
import type { StockIdea } from "./stockIdeasTypes";
import { useBranding } from "./brandingContext";
import { LEGACY_ORG_ID } from "./tenantConstants";
import { toastError } from "./toast";

export type { StockIdea, StockIdeaCategory, StockIdeaStatus } from "./stockIdeasTypes";

const PUBLIC_IDEAS_API = "/api/public/ideas";
const SELECT = "id, created_at, title, description, category, status, votes";
const POLL_MS = 12_000;

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : res.statusText);
  }
  return data;
}

function publicIdeasUrl(organizationId: string | null): string {
  const org = organizationId ?? LEGACY_ORG_ID;
  return `${PUBLIC_IDEAS_API}?org=${encodeURIComponent(org)}`;
}

export function useStockIdeas() {
  const { branding } = useBranding();
  const [ideas, setIdeas] = useState<StockIdea[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const organizationId = branding.organizationId;

  const load = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data, error } = await supabase
          .from("stock_ideas")
          .select(SELECT)
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        setIdeas((data ?? []).map((row: Parameters<typeof ideaFromRow>[0]) => ideaToClient(ideaFromRow(row))));
        return;
      }

      const res = await fetch(publicIdeasUrl(organizationId), { cache: "no-store" });
      const rows = await parseJson<StockIdeaDto[]>(res);
      setIdeas(rows.map(ideaToClient));
    } catch (e) {
      console.warn("[StockIdeas] load:", e);
      toastError("Impossible de charger les idées.");
      setIdeas([]);
    } finally {
      setHydrated(true);
    }
  }, [supabase, organizationId]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setCanManage(Boolean(data.session));
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setCanManage(Boolean(session));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  const addIdea = useCallback(
    (draft: Omit<StockIdea, "id" | "createdAt" | "votes"> & { votes?: number }) => {
      void (async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            const { data, error } = await supabase
              .from("stock_ideas")
              .insert({
                title: draft.title,
                description: draft.description || null,
                category: draft.category,
                status: "nouveau",
              })
              .select(SELECT)
              .single();
            if (error) throw error;
            setIdeas((prev) => [ideaToClient(ideaFromRow(data)), ...prev].slice(0, 500));
            return;
          }

          const res = await fetch(publicIdeasUrl(organizationId), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: draft.title,
              description: draft.description,
              category: draft.category,
            }),
          });
          const created = await parseJson<StockIdeaDto>(res);
          setIdeas((prev) => [ideaToClient(created), ...prev].slice(0, 500));
        } catch (e) {
          console.warn("[StockIdeas] add:", e);
          toastError("Impossible d'ajouter l'idée.");
        }
      })();
    },
    [supabase, organizationId],
  );

  const updateIdea = useCallback(
    (id: string, patch: Partial<Pick<StockIdea, "title" | "description" | "category" | "status">>) => {
      void (async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            const { data, error } = await supabase
              .from("stock_ideas")
              .update(patch)
              .eq("id", id)
              .select(SELECT)
              .single();
            if (error) throw error;
            setIdeas((prev) => prev.map((i) => (i.id === id ? ideaToClient(ideaFromRow(data)) : i)));
            return;
          }

          const res = await fetch(`${PUBLIC_IDEAS_API}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          const updated = await parseJson<StockIdeaDto>(res);
          setIdeas((prev) => prev.map((i) => (i.id === id ? ideaToClient(updated) : i)));
        } catch (e) {
          console.warn("[StockIdeas] update:", e);
          toastError("Modification impossible. Connectez-vous pour gérer les idées.");
        }
      })();
    },
    [supabase],
  );

  const removeIdea = useCallback(
    (id: string) => {
      void (async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            const { error } = await supabase.from("stock_ideas").delete().eq("id", id);
            if (error) throw error;
            setIdeas((prev) => prev.filter((i) => i.id !== id));
            return;
          }

          const res = await fetch(`${PUBLIC_IDEAS_API}/${id}`, { method: "DELETE" });
          if (!res.ok && res.status !== 204) {
            await parseJson(res);
          }
          setIdeas((prev) => prev.filter((i) => i.id !== id));
        } catch (e) {
          console.warn("[StockIdeas] remove:", e);
          toastError("Suppression impossible. Connectez-vous pour gérer les idées.");
        }
      })();
    },
    [supabase],
  );

  const voteIdea = useCallback(
    (id: string, delta: number) => {
      void (async () => {
        const current = ideas.find((i) => i.id === id);
        if (!current) return;
        const nextVotes = Math.max(0, current.votes + delta);
        setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, votes: nextVotes } : i)));
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) return;
          const { error } = await supabase.from("stock_ideas").update({ votes: nextVotes }).eq("id", id);
          if (error) throw error;
        } catch (e) {
          console.warn("[StockIdeas] vote:", e);
          void load();
        }
      })();
    },
    [ideas, supabase, load],
  );

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(ideas, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `boite-a-idees-stock-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [ideas]);

  return useMemo(
    () => ({
      ideas,
      hydrated,
      canManage,
      addIdea,
      updateIdea,
      removeIdea,
      voteIdea,
      exportJson,
      reload: load,
    }),
    [ideas, hydrated, canManage, addIdea, updateIdea, removeIdea, voteIdea, exportJson, load],
  );
}
