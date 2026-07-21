import {
  mergeBranding,
  type AppBranding,
} from "../branding";
import { fetchAppSettingsRow } from "../appSettings/fetchAppSettingsRow";
import { getServerAuthUser } from "./authSafe";
import { getPublicBrandingOrganizationId, getServerOrgContext } from "./orgContext";
import { createSupabaseAdmin } from "./supabaseAdmin";
import { createServerSupabase } from "./supabaseServer";
import { createServerSignedStorageUrl } from "./storageSignedUrl";

async function readBrandingForOrganization(organizationId: string): Promise<AppBranding | null> {
  try {
    const admin = createSupabaseAdmin();
    const { row, usedFallback } = await fetchAppSettingsRow(admin, organizationId, {
      logLabel: "branding/admin",
    });
    if (usedFallback) {
      console.warn(
        "[branding] migration app_settings probablement manquante — exécuter npm run audit:app-settings",
      );
    }
    if (!row) return null;
    return mergeBranding(row);
  } catch (e) {
    console.warn("[branding] readBrandingForOrganization:", e);
    return null;
  }
}

/** Lecture serveur (pages, metadata, actions) — filtrée par RLS / organisation courante. */
export async function getBrandingServer(): Promise<AppBranding> {
  try {
    const supabase = await createServerSupabase();
    const user = await getServerAuthUser(supabase);
    const ctx = await getServerOrgContext();

    if (user && !ctx) {
      try {
        const admin = createSupabaseAdmin();
        const { data: profile } = await admin
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.organization_id) {
          const fromAdmin = await readBrandingForOrganization(profile.organization_id as string);
          if (fromAdmin) return fromAdmin;
        }
      } catch (e) {
        console.warn("[branding] admin fallback:", e);
      }
      return mergeBranding(null);
    }

    const organizationId = ctx?.organizationId ?? getPublicBrandingOrganizationId();
    const { row, usedFallback } = await fetchAppSettingsRow(supabase, organizationId, {
      logLabel: "branding",
    });

    if (row) {
      if (usedFallback) {
        console.warn(
          "[branding] migration app_settings probablement manquante — exécuter npm run audit:app-settings",
        );
      }
      return mergeBranding(row);
    }

    if (ctx) {
      const fromAdmin = await readBrandingForOrganization(ctx.organizationId);
      if (fromAdmin) return fromAdmin;
    }

    return mergeBranding(null);
  } catch (e) {
    console.warn("[branding] getBrandingServer:", e);
    return mergeBranding(null);
  }
}

/** Branding avec URLs storage résolues (signées 5 min) pour affichage serveur. */
export async function getBrandingServerResolved(): Promise<AppBranding> {
  const branding = await getBrandingServer();
  const markSigned = await createServerSignedStorageUrl("idena-mark", branding.markUrl);
  return {
    ...branding,
    markUrl: markSigned ?? branding.markUrl,
  };
}
