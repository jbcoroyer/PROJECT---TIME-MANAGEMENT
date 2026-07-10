"use server";

import { revalidatePath } from "next/cache";
import {
  brandingToDbPatch,
  type AppBrandingPatch,
} from "../../lib/branding";
import { slugifyOrganizationName } from "../../lib/tenantConstants";
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

async function uniqueOrganizationSlug(admin: ReturnType<typeof createSupabaseAdmin>, base: string) {
  let slug = slugifyOrganizationName(base);
  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const { data } = await admin.from("organizations").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

/** Inscription publique : crée l'utilisateur, son organisation et les réglages initiaux. */
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
    },
  });

  if (createError || !created.user) {
    return { ok: false, error: createError?.message ?? "Création du compte impossible." };
  }

  const userId = created.user.id;
  const slug = await uniqueOrganizationSlug(admin, organizationName);

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: organizationName, slug })
    .select("id")
    .single();

  if (orgError || !org) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: orgError?.message ?? "Création de l'organisation impossible." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("team_member_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.team_member_id) {
    await admin.from("organizations").delete().eq("id", org.id);
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "Profil utilisateur introuvable après inscription." };
  }

  const { error: teamError } = await admin
    .from("team_members")
    .update({ organization_id: org.id })
    .eq("id", profile.team_member_id);

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({ organization_id: org.id, role: "admin", display_name: displayName })
    .eq("id", userId);

  if (teamError || profileUpdateError) {
    await admin.from("organizations").delete().eq("id", org.id);
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: teamError?.message ?? profileUpdateError?.message ?? "Liaison organisation impossible." };
  }

  const { error: settingsError } = await admin.from("app_settings").upsert(
    {
      id: org.id,
      organization_id: org.id,
      app_name: organizationName,
      app_short_name: organizationName,
      is_configured: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );

  if (settingsError) {
    await admin.from("organizations").delete().eq("id", org.id);
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: settingsError.message };
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
