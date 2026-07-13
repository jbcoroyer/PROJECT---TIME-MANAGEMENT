"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_BRANDING,
  mergeBranding,
  mapAppSettingsRow,
  brandingStyleVars,
  type AppBranding,
} from "./branding";
import { LEGACY_ORG_ID } from "./tenantConstants";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { useRealtimeReload } from "./useRealtimeReload";
import { resolveStorageAssetUrl } from "./storageClient";
import { APP_MARK_STORAGE_BUCKET } from "./storageBuckets";

type BrandingContextValue = {
  branding: AppBranding;
  loading: boolean;
  reload: () => Promise<void>;
  patchBranding: (patch: Partial<AppBranding>) => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

const APP_SETTINGS_SELECT =
  "id, organization_id, idena_mark_url, app_name, app_short_name, tagline, logo_url, icon_url, mark_url, primary_color, locale, timezone, sector, outlook_category_name, default_public_survey_id, is_configured, social_thematics, print_species, enabled_modules, updated_at";

function applyBrandingToDocument(branding: AppBranding) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = branding.locale.trim().split(/[-_]/)[0] || "fr";
  const vars = brandingStyleVars(branding.primaryColor);
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [branding, setBranding] = useState<AppBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let organizationId: string | null = null;
    if (user) {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .maybeSingle();
        organizationId = (profile?.organization_id as string | null) ?? null;
        if (organizationId) break;
        if (attempt < 5) {
          await new Promise((resolve) => window.setTimeout(resolve, 350));
        }
      }
    }

    let query = supabase.from("app_settings").select(APP_SETTINGS_SELECT);

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    } else if (!user) {
      query = query.eq("organization_id", LEGACY_ORG_ID);
    } else {
      setBranding(DEFAULT_BRANDING);
      setLoading(false);
      return;
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn("[Branding] app_settings:", error.message);
      setBranding(DEFAULT_BRANDING);
      setLoading(false);
      return;
    }

    const next = mergeBranding(data ? mapAppSettingsRow(data) : null);
    const resolvedMark = next.markUrl
      ? await resolveStorageAssetUrl(supabase, APP_MARK_STORAGE_BUCKET, next.markUrl)
      : null;
    const brandingWithUrls = { ...next, markUrl: resolvedMark ?? next.markUrl };
    setBranding(brandingWithUrls);
    applyBrandingToDocument(brandingWithUrls);
    setLoading(false);
  }, [supabase]);

  const patchBranding = useCallback((patch: Partial<AppBranding>) => {
    setBranding((prev) => {
      const next = { ...prev, ...patch };
      applyBrandingToDocument(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useRealtimeReload({
    table: "app_settings",
    channelName: "app_settings_branding",
    onChange: useCallback(() => {
      void load();
    }, [load]),
  });

  const value = useMemo(
    () => ({
      branding,
      loading,
      reload: load,
      patchBranding,
    }),
    [branding, loading, load, patchBranding],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    return {
      branding: DEFAULT_BRANDING,
      loading: false,
      reload: async () => {},
      patchBranding: () => {},
    };
  }
  return ctx;
}
