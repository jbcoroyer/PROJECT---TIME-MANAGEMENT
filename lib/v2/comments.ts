"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "../supabaseBrowser";

export type EntityComment = {
  id: string;
  channelKey: string;
  authorId: string | null;
  authorName: string;
  text: string;
  mentions: string[];
  createdAt: string;
};

export type CommentsBackend = "supabase" | "local";

type CommentRow = {
  id: string;
  channel_key: string;
  author_id: string | null;
  author_name: string;
  body: string;
  mentions: string[] | null;
  created_at: string;
};

function localKey(channelKey: string): string {
  return `v2-comments:${channelKey}`;
}

function readLocal(channelKey: string): EntityComment[] {
  try {
    const raw = window.localStorage.getItem(localKey(channelKey));
    const parsed = raw ? (JSON.parse(raw) as EntityComment[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(channelKey: string, list: EntityComment[]) {
  try {
    window.localStorage.setItem(localKey(channelKey), JSON.stringify(list));
  } catch {
    /* ignoré */
  }
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `c-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function detectBackend(supabase: SupabaseClient): Promise<CommentsBackend> {
  const { error } = await supabase.from("entity_comments").select("id").limit(1);
  return error ? "local" : "supabase";
}

function rowToComment(row: CommentRow): EntityComment {
  return {
    id: row.id,
    channelKey: row.channel_key,
    authorId: row.author_id,
    authorName: row.author_name,
    text: row.body,
    mentions: row.mentions ?? [],
    createdAt: row.created_at,
  };
}

/** Extrait les @mentions d'un texte (jusqu'à 40 caractères, mots/espaces). */
export function extractMentions(text: string, knownNames: string[]): string[] {
  const found = new Set<string>();
  for (const name of knownNames) {
    const re = new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    if (re.test(text)) found.add(name);
  }
  return Array.from(found);
}

/**
 * Fil de commentaires par entité.
 * Supabase partagé si la table existe ; sinon localStorage + broadcast temps réel.
 */
export function useEntityComments(
  channelKey: string,
  currentUser: { id: string | null; name: string },
  knownNames: string[] = [],
) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [comments, setComments] = useState<EntityComment[]>([]);
  const [backend, setBackend] = useState<CommentsBackend>("local");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    const mode = await detectBackend(supabase);
    setBackend(mode);

    if (mode === "local") {
      setComments(readLocal(channelKey));
      return;
    }

    const { data, error } = await supabase
      .from("entity_comments")
      .select("id, channel_key, author_id, author_name, body, mentions, created_at")
      .eq("channel_key", channelKey)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[Comments] load:", error);
      setComments([]);
      return;
    }
    setComments(((data ?? []) as CommentRow[]).map(rowToComment));
  }, [channelKey, supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (backend === "supabase") {
      const channel = supabase
        .channel(`entity-comments-${channelKey}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "entity_comments",
            filter: `channel_key=eq.${channelKey}`,
          },
          () => {
            void load();
          },
        )
        .subscribe();
      channelRef.current = channel;
      return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      };
    }

    const channel = supabase.channel(`v2-comments-${channelKey}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "comment" }, (payload: { payload?: EntityComment }) => {
        const incoming = payload.payload;
        if (!incoming) return;
        setComments((prev) => {
          if (prev.some((c) => c.id === incoming.id)) return prev;
          const next = [...prev, incoming].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          writeLocal(channelKey, next);
          return next;
        });
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [backend, channelKey, load, supabase]);

  const post = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const comment: EntityComment = {
        id: newId(),
        channelKey,
        authorId: currentUser.id,
        authorName: currentUser.name,
        text: trimmed,
        mentions: extractMentions(trimmed, knownNames),
        createdAt: new Date().toISOString(),
      };

      if (backend === "local") {
        setComments((prev) => {
          const next = [...prev, comment];
          writeLocal(channelKey, next);
          return next;
        });
        channelRef.current?.send({ type: "broadcast", event: "comment", payload: comment });
        return;
      }

      void (async () => {
        const { data, error } = await supabase
          .from("entity_comments")
          .insert({
            channel_key: channelKey,
            author_id: currentUser.id,
            author_name: currentUser.name,
            body: trimmed,
            mentions: comment.mentions,
          })
          .select("id, channel_key, author_id, author_name, body, mentions, created_at")
          .single();
        if (error) {
          console.warn("[Comments] post:", error);
          return;
        }
        const created = rowToComment(data as CommentRow);
        setComments((prev) => {
          if (prev.some((c) => c.id === created.id)) return prev;
          return [...prev, created].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
      })();
    },
    [backend, channelKey, currentUser.id, currentUser.name, knownNames, supabase],
  );

  return { comments, backend, post };
}
