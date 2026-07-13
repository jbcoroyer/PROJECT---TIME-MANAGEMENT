"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { resolveStorageAssetUrl } from "./storageClient";
import { isHttpUrl, type StorageBucket } from "./storagePaths";

/**
 * Résout un chemin storage (ou URL legacy) en URL affichable signée (5 min).
 */
export function useResolvedStorageUrl(
  bucket: StorageBucket,
  storedValue: string | null | undefined,
): string | null {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storedValue?.trim()) {
      queueMicrotask(() => setUrl(null));
      return;
    }
    if (isHttpUrl(storedValue)) {
      queueMicrotask(() => setUrl(storedValue));
      return;
    }
    let cancelled = false;
    void resolveStorageAssetUrl(supabase, bucket, storedValue).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, bucket, storedValue]);

  return url;
}
