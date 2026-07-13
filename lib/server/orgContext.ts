import "server-only";

import { LEGACY_ORG_ID } from "../tenantConstants";
import { createSupabaseAdmin } from "./supabaseAdmin";
import { createServerSupabase } from "./supabaseServer";

export type ServerOrgContext = {
  userId: string;
  organizationId: string;
  isAdmin: boolean;
};

/** Organisation courante (profil connecté). */
export async function getServerOrgContext(): Promise<ServerOrgContext | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!error && profile?.organization_id) {
    return {
      userId: user.id,
      organizationId: profile.organization_id as string,
      isAdmin: profile.role === "admin",
    };
  }

  try {
    const admin = createSupabaseAdmin();
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle();
    if (!adminProfile?.organization_id) return null;
    return {
      userId: user.id,
      organizationId: adminProfile.organization_id as string,
      isAdmin: adminProfile.role === "admin",
    };
  } catch {
    return null;
  }
}

/** Branding public avant connexion : organisation legacy (instance unique héritée). */
export function getPublicBrandingOrganizationId(): string {
  return LEGACY_ORG_ID;
}
