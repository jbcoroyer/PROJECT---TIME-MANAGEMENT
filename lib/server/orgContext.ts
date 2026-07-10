import "server-only";

import { LEGACY_ORG_ID } from "../tenantConstants";
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

  if (error || !profile?.organization_id) return null;

  return {
    userId: user.id,
    organizationId: profile.organization_id,
    isAdmin: profile.role === "admin",
  };
}

/** Branding public avant connexion : organisation legacy (instance unique héritée). */
export function getPublicBrandingOrganizationId(): string {
  return LEGACY_ORG_ID;
}
