"use server";

import { revalidatePath } from "next/cache";
import {
  brandingToDbPatch,
  type AppBrandingPatch,
} from "../../lib/branding";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";
import { sendTransactionalEmail } from "../../lib/server/email";

export type SignUpWithOrganizationInput = {
  email: string;
  password: string;
  displayName: string;
  jobTitle?: string | null;
  organizationName: string;
};

export type SignUpWithOrganizationResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

/**
 * Inscription publique B2C : handle_new_user crée l'espace personnel
 * (organisation + profil admin + réglages) à partir des metadata.
 * La confirmation email est requise sauf si désactivée côté Supabase.
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

  const supabase = await createServerSupabase();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        job_title: input.jobTitle?.trim() || null,
        organization_name: organizationName,
      },
      emailRedirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent("/setup")}`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: "Création du compte impossible." };
  }

  if (data.session) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "http://localhost:3000";
    void sendTransactionalEmail({
      to: email,
      subject: `Bienvenue sur ${organizationName}`,
      html: `<p>Bonjour ${displayName},</p><p>Votre espace <strong>${organizationName}</strong> est prêt. <a href="${baseUrl}/setup">Terminez la configuration</a> pour commencer.</p>`,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true, needsEmailConfirmation: !data.session };
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
