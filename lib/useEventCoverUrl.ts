"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { resolveStorageAssetUrl } from "./storageClient";

const EVENT_COVER_BUCKET = "event-documents" as const;

export function useEventCoverUrl(coverImagePath: string | null | undefined) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coverImagePath?.trim()) {
      setUrl(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void resolveStorageAssetUrl(supabase, EVENT_COVER_BUCKET, coverImagePath).then((resolved) => {
      if (cancelled) return;
      setUrl(resolved);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [coverImagePath, supabase]);

  return { url, loading };
}
