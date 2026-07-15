"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fallbackReferenceData, type ReferenceRecord } from "./referenceData";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { resolveStorageAssetUrl } from "./storageClient";
import { ensureDefaultBoard, listByBoard } from "./v2/boardColumns";

type ReferenceDataState = {
  admins: ReferenceRecord[];
  companies: ReferenceRecord[];
  domains: ReferenceRecord[];
  columns: ReferenceRecord[];
  loading: boolean;
};

type TeamMemberRecord = {
  id?: string;
  display_name?: string;
  avatar_url?: string | null;
};

type CompanyRecord = {
  id?: string;
  name?: string;
  logo_url?: string | null;
};

type DomainRecord = {
  id?: string;
  name?: string;
  color?: string | null;
};

const ReferenceDataContext = createContext<ReferenceDataState | null>(null);

async function loadBoardColumns(): Promise<ReferenceRecord[]> {
  try {
    const boardId = await ensureDefaultBoard();
    if (!boardId) return [];
    const boardCols = await listByBoard(boardId);
    return boardCols.map((col) => ({
      id: col.id,
      name: col.label,
      color: col.color,
      isDone: col.isDone,
    }));
  } catch {
    return [];
  }
}

export function ReferenceDataProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [state, setState] = useState<ReferenceDataState>({
    ...fallbackReferenceData,
    loading: true,
  });
  const reloadTimerRef = useRef<number | null>(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    const [adminsRes, companiesRes, domainsRes, boardColumns] = await Promise.all([
      supabase
        .from("team_members")
        .select("id, display_name, avatar_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("companies")
        .select("id, name, logo_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("domains")
        .select("id, name, color")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      loadBoardColumns(),
    ]);

    const adminsRaw = (adminsRes.data ?? []) as TeamMemberRecord[];
    const companiesRaw = (companiesRes.data ?? []) as CompanyRecord[];

    const admins = await Promise.all(
      adminsRaw.map(async (item) => {
        const rawAvatar = item.avatar_url ?? null;
        const avatarUrl = rawAvatar
          ? await resolveStorageAssetUrl(supabase, "member-avatars", rawAvatar)
          : null;
        return {
          id: String(item.id ?? ""),
          name: String(item.display_name ?? ""),
          avatarUrl,
        };
      }),
    ).then((rows) => rows.filter((item) => item.id && item.name));

    const companies = await Promise.all(
      companiesRaw.map(async (item) => {
        const rawLogo = item.logo_url ?? null;
        const logoUrl = rawLogo
          ? await resolveStorageAssetUrl(supabase, "company-logos", rawLogo)
          : null;
        return {
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
          logoUrl,
        };
      }),
    ).then((rows) => rows.filter((item) => item.id && item.name));

    const domains =
      ((domainsRes.data ?? []) as DomainRecord[])
        .map((item) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
          color: item.color ?? null,
        }))
        .filter((item) => item.id && item.name) || [];

    const columns =
      boardColumns.length > 0 ? boardColumns : fallbackReferenceData.columns;

    loadedRef.current = true;
    setState({
      admins,
      companies: companies.length > 0 ? companies : [],
      domains: domains.length > 0 ? domains : fallbackReferenceData.domains,
      columns,
      loading: false,
    });
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const runLoad = async () => {
      try {
        await load();
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false }));
      }
    };

    void runLoad();

    const scheduleReload = () => {
      if (reloadTimerRef.current) {
        window.clearTimeout(reloadTimerRef.current);
      }
      reloadTimerRef.current = window.setTimeout(() => {
        void runLoad();
      }, 120);
    };

    const channel = supabase
      .channel("reference-data-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => {
        scheduleReload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, () => {
        scheduleReload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "domains" }, () => {
        scheduleReload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "board_columns" }, () => {
        scheduleReload();
      })
      .subscribe();

    return () => {
      cancelled = true;
      if (reloadTimerRef.current) {
        window.clearTimeout(reloadTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  return (
    <ReferenceDataContext.Provider value={state}>{children}</ReferenceDataContext.Provider>
  );
}

export function useReferenceData(): ReferenceDataState {
  const ctx = useContext(ReferenceDataContext);
  if (!ctx) {
    throw new Error("useReferenceData doit être utilisé sous ReferenceDataProvider.");
  }
  return ctx;
}
