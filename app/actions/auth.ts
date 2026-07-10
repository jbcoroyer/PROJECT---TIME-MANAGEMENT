"use server";

import { revalidatePath } from "next/cache";
import {
  brandingToDbPatch,
  type AppBrandingPatch,
} from "../../lib/branding";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";

export type SignUpWithOrganizationInput = {
  email: string;
  password: string;
  displayName: string;
  jobTitle?: string | null;
  organizationName: string;
};

export type SignUpWithOrganizationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Inscription publique B2C : handle_new_user crée l'espace personnel
 * (organisation + profil admin + réglages) à partir des metadata.
 */
export async function signUpWithOrganization(
  input: SignUpWithOrganizationInput,
): Promise<SignUpWithOrganizationResult> {
  const email = input.email.trim();
  const password = input.password;
  const displayName = input.displayName.trim();
  const organizationName = input.organizationName.trim();

  if (!email || !password) return { ok: false, error: "Email et mot de passe requis." };
  if (!displayName) return { ok: false, error: "Le nom est obligatoire." };
  if (!organizationName) return { ok: false, error: "Le nom de l'organisation est obligatoire." };
  if (password.length < 6) return { ok: false, error: "Mot de passe trop court (6 caractères minimum)." };

  const admin = createSupabaseAdmin();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      job_title: input.jobTitle?.trim() || null,
      organization_name: organizationName,
    },
  });

  if (createError || !created.user) {
    return { ok: false, error: createError?.message ?? "Création du compte impossible." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Connexion après inscription (côté client : signInWithPassword). */
export async function signInAfterSignUp(email: string, password: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function provisionOrganizationBranding(
  organizationId: string,
  patch: AppBrandingPatch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = brandingToDbPatch(patch, organizationId);
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("app_settings").upsert(row, { onConflict: "organization_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
