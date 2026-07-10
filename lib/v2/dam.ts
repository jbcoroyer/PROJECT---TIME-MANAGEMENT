"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "../useCurrentUser";
import { getSupabaseBrowser } from "../supabaseBrowser";
import { toastError } from "../toast";

export const DAM_TYPES = ["Logo", "Visuel", "Template", "Document", "Vidéo", "Autre"] as const;
export type DamType = (typeof DAM_TYPES)[number];

export type DamAsset = {
  id: string;
  name: string;
  url: string;
  company: string;
  type: DamType;
  tags: string[];
  createdAt: string;
};

type DamAssetRow = {
  id: string;
  name: string;
  url: string;
  company: string;
  type: string;
  tags: string[] | null;
  created_at: string;
};

const SELECT = "id, name, url, company, type, tags, created_at";

function rowToAsset(row: DamAssetRow): DamAsset {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    company: row.company,
    type: row.type as DamType,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

export function useDamAssets() {
  const { user } = useCurrentUser();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [assets, setAssets] = useState<DamAsset[]>([]);
  const assetsRef = useRef<DamAsset[]>([]);

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const load = useCallback(async () => {
    if (!user) {
      setAssets([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("dam_assets")
        .select(SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAssets((data ?? []).map((row: DamAssetRow) => rowToAsset(row)));
    } catch (e) {
      console.warn("[DAM] load:", e);
      toastError("Impossible de charger les assets.");
      setAssets([]);
    }
  }, [supabase, user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dam-assets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dam_assets" },
        (payload: { eventType?: string; old?: { id?: string }; new?: DamAssetRow }) => {
          if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (!deletedId) return;
            setAssets((prev) => prev.filter((asset) => asset.id !== deletedId));
            return;
          }
          if (!payload.new) return;
          const mapped = rowToAsset(payload.new);
          setAssets((prev) => {
            const idx = prev.findIndex((asset) => asset.id === mapped.id);
            if (idx === -1) return [mapped, ...prev];
            const next = [...prev];
            next[idx] = mapped;
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  const add = useCallback(
    (asset: Omit<DamAsset, "id" | "createdAt">) => {
      void (async () => {
        try {
          const { data, error } = await supabase
            .from("dam_assets")
            .insert({
              name: asset.name,
              url: asset.url,
              company: asset.company,
              type: asset.type,
              tags: asset.tags,
            })
            .select(SELECT)
            .single();
          if (error) throw error;
          const created = rowToAsset(data as DamAssetRow);
          setAssets((prev) => {
            if (prev.some((item) => item.id === created.id)) {
              return prev.map((item) => (item.id === created.id ? created : item));
            }
            return [created, ...prev];
          });
        } catch (e) {
          console.warn("[DAM] add:", e);
          toastError("Impossible d'ajouter l'asset.");
        }
      })();
    },
    [supabase],
  );

  const remove = useCallback(
    (id: string) => {
      const previous = assetsRef.current;
      setAssets((prev) => prev.filter((asset) => asset.id !== id));
      void (async () => {
        try {
          const { error } = await supabase.from("dam_assets").delete().eq("id", id);
          if (error) throw error;
        } catch (e) {
          console.warn("[DAM] remove:", e);
          setAssets(previous);
          toastError("Impossible de supprimer l'asset.");
        }
      })();
    },
    [supabase],
  );

  return { assets, add, remove };
}

/** Recherche simple par mot-clé sur nom, tags, société et type. */
export function searchAssets(assets: DamAsset[], query: string): DamAsset[] {
  const q = query.trim().toLowerCase();
  if (!q) return assets;
  const terms = q.split(/\s+/);
  return assets.filter((a) => {
    const haystack = [a.name, a.company, a.type, ...a.tags].join(" ").toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
