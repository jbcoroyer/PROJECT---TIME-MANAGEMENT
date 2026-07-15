"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { resolveStorageAssetUrl } from "./storageClient";

const EVENT_COVER_BUCKET = "event-documents" as const;

export function useEventCoverUrl(coverImagePath: string | null | undefined) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const trimmedPath = coverImagePath?.trim() ?? "";
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trimmedPath) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    void resolveStorageAssetUrl(supabase, EVENT_COVER_BUCKET, trimmedPath).then((resolved) => {
      if (cancelled) return;
      setResolvedUrl(resolved);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [trimmedPath, supabase]);

  return {
    url: trimmedPath ? resolvedUrl : null,
    loading: trimmedPath ? loading : false,
  };
}
