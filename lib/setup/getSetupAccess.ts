import "server-only";

import { fetchOrganizationIsConfigured } from "../appSettings/fetchAppSettingsRow";
import { createSupabaseAdmin } from "../server/supabaseAdmin";
import { getServerOrgContext } from "../server/orgContext";
import { createServerSupabase } from "../server/supabaseServer";
import { resolveCanCompleteSetup } from "./setupAccessRules";

export type SetupAccess = {
  isConfigured: boolean;
  isAuthenticated: boolean;
  canCompleteSetup: boolean;
  isAdmin: boolean;
  organizationId: string | null;
};

async function countAdminsForOrg(organizationId: string): Promise<number> {
  try {
    const admin = createSupabaseAdmin();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("organization_id", organizationId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countMembersForOrg(organizationId: string): Promise<number> {
  try {
    const admin = createSupabaseAdmin();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function resolveEffectiveAdmin(userId: string, organizationId: string): Promise<boolean> {
  try {
    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    return profile?.role === "admin";
  } catch {
    return false;
  }
}

/** Indique si l'utilisateur courant peut lancer ou terminer l'installation de son organisation. */
export async function getSetupAccess(): Promise<SetupAccess> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ctx = await getServerOrgContext();
  let organizationId = ctx?.organizationId ?? null;
  let isAdmin = ctx?.isAdmin ?? false;

  if (user && !organizationId) {
    try {
      const admin = createSupabaseAdmin();
      const { data: profile } = await admin
        .from("profiles")
        .select("organization_id, role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.organization_id) {
        organizationId = profile.organization_id as string;
        isAdmin = profile.role === "admin";
        ctx = {
          userId: user.id,
          organizationId,
          isAdmin,
        };
      }
    } catch (e) {
      console.warn("[setup] profil admin:", e);
    }
  }

  let isConfigured = false;
  if (organizationId) {
    try {
      const admin = createSupabaseAdmin();
      isConfigured = await fetchOrganizationIsConfigured(admin, organizationId);
    } catch {
      isConfigured = await fetchOrganizationIsConfigured(supabase, organizationId);
    }
  }

  const isAuthenticated = Boolean(user);

  let effectiveIsAdmin = isAdmin;
  if (user && organizationId && !effectiveIsAdmin) {
    effectiveIsAdmin = await resolveEffectiveAdmin(user.id, organizationId);
  }

  let adminCount = 0;
  let memberCount = 0;
  if (organizationId) {
    [adminCount, memberCount] = await Promise.all([
      countAdminsForOrg(organizationId),
      countMembersForOrg(organizationId),
    ]);
  }

  const canCompleteSetup = resolveCanCompleteSetup({
    isAuthenticated,
    organizationId,
    isConfigured,
    isAdmin: effectiveIsAdmin,
    adminCount,
    memberCount,
  });

  return {
    isConfigured,
    isAuthenticated,
    canCompleteSetup,
    isAdmin: effectiveIsAdmin,
    organizationId,
  };
}
