"use server";

import { revalidatePath } from "next/cache";
import { mapAppSettingsRow, mergeBranding } from "../../lib/branding";
import { getDefaultModuleRoute } from "../../lib/modules";
import { splitDisplayName } from "../../lib/inviteOnboarding";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { syncStripeSubscriptionQuantity } from "../../lib/server/stripeSubscriptionSync";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";
import { sendTransactionalEmail } from "../../lib/server/email";
import { needsInviteProfileCompletion } from "../../lib/inviteOnboarding";

export type InviteTeamMemberResult =
  | { ok: true }
  | { ok: false; error: string };

export type InviteWelcomeContext =
  | { authenticated: false }
  | {
      authenticated: true;
      needsOnboarding: false;
      redirectTo: string;
    }
  | {
      authenticated: true;
      needsOnboarding: true;
      email: string;
      workspaceName: string;
      workspaceTagline: string;
      inviterName: string;
      organizationId: string;
      teamMemberId: string | null;
      suggestedFirstName: string;
      suggestedLastName: string;
      suggestedJobTitle: string;
    };

export type CompleteInviteProfileResult = { ok: true } | { ok: false; error: string };

const INVITE_ACCEPT_PATH = "/invite/accept";

export async function inviteTeamMember(input: {
  email: string;
  role?: "admin" | "user";
}): Promise<InviteTeamMemberResult> {
  const ctx = await getServerOrgContext();
  if (!ctx?.isAdmin) {
    return { ok: false, error: "Seul un administrateur peut inviter des collègues." };
  }

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Adresse e-mail invalide." };
  }

  const role = input.role === "admin" ? "admin" : "user";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const admin = createSupabaseAdmin();

  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", ctx.userId)
    .maybeSingle();

  const { data: settingsRow } = await admin
    .from("app_settings")
    .select("app_name, app_short_name")
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  const workspaceName =
    (settingsRow?.app_name as string | undefined)?.trim() ||
    (settingsRow?.app_short_name as string | undefined)?.trim() ||
    "votre espace";
  const inviterName = (inviterProfile?.display_name as string | undefined)?.trim() || "Un administrateur";

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?type=invite&next=${encodeURIComponent(INVITE_ACCEPT_PATH)}`,
    data: {
      organization_id: ctx.organizationId,
      role,
      invited: true,
      invited_by_user_id: ctx.userId,
      invited_by_name: inviterName,
      workspace_name: workspaceName,
      display_name: email.split("@")[0] ?? "Collaborateur",
    },
  });

  if (error) {
    if (error.message.includes("already been registered") || error.message.includes("already exists")) {
      return { ok: false, error: "Un compte existe déjà avec cet e-mail." };
    }
    return { ok: false, error: error.message };
  }

  await sendTransactionalEmail({
    to: email,
    subject: `Invitation à rejoindre ${workspaceName}`,
    html: `<p><strong>${inviterName}</strong> vous invite à rejoindre l'espace <strong>${workspaceName}</strong>.</p><p>Ouvrez l'e-mail d'invitation pour définir votre mot de passe et compléter votre profil.</p>`,
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function getInviteWelcomeContext(): Promise<InviteWelcomeContext> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { authenticated: false };

  if (!needsInviteProfileCompletion(user)) {
    const admin = createSupabaseAdmin();
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const orgId = (profile?.organization_id as string | null) ?? null;
    let redirectTo = "/dashboard/kanban";
    if (orgId) {
      const { data: settings } = await admin
        .from("app_settings")
        .select(
          "organization_id, app_name, enabled_modules, is_configured, primary_color, locale, timezone, tagline, mark_url",
        )
        .eq("organization_id", orgId)
        .maybeSingle();
      if (settings) {
        const branding = mergeBranding(mapAppSettingsRow(settings));
        redirectTo = getDefaultModuleRoute(branding.enabledModules);
      }
    }
    return { authenticated: true, needsOnboarding: false, redirectTo };
  }

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, organization_id, team_member_id, team_members(job_title)")
    .eq("id", user.id)
    .maybeSingle();

  const organizationId = (profile?.organization_id as string | null) ?? user.user_metadata?.organization_id ?? null;
  if (!organizationId) {
    return { authenticated: true, needsOnboarding: false, redirectTo: "/login" };
  }

  const { data: settings } = await admin
    .from("app_settings")
    .select("app_name, tagline")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const meta = user.user_metadata ?? {};
  const workspaceName =
    (settings?.app_name as string | undefined)?.trim() ||
    (meta.workspace_name as string | undefined)?.trim() ||
    "votre espace";
  const workspaceTagline = (settings?.tagline as string | undefined)?.trim() || "";
  const inviterName = (meta.invited_by_name as string | undefined)?.trim() || "Un administrateur";
  const member = (profile?.team_members as { job_title?: string | null } | null) ?? null;
  const suggested = splitDisplayName(profile?.display_name as string | undefined);

  return {
    authenticated: true,
    needsOnboarding: true,
    email: user.email ?? "",
    workspaceName,
    workspaceTagline,
    inviterName,
    organizationId,
    teamMemberId: (profile?.team_member_id as string | null) ?? null,
    suggestedFirstName: suggested.firstName,
    suggestedLastName: suggested.lastName,
    suggestedJobTitle: member?.job_title?.trim() ?? "",
  };
}

export async function completeInviteProfile(input: {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  avatarStoragePath?: string | null;
}): Promise<CompleteInviteProfileResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const displayName = `${firstName} ${lastName}`.trim();
  const jobTitle = input.jobTitle?.trim() || null;

  if (!firstName || !lastName) {
    return { ok: false, error: "Le prénom et le nom sont obligatoires." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Connectez-vous pour continuer." };
  if (!needsInviteProfileCompletion(user)) {
    return { ok: false, error: "Ce profil a déjà été complété." };
  }

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("team_member_id, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const teamMemberId = (profile?.team_member_id as string | null) ?? null;
  if (!teamMemberId) {
    return { ok: false, error: "Profil équipe introuvable." };
  }

  const memberPatch: Record<string, string | null> = {
    display_name: displayName,
    job_title: jobTitle,
  };
  if (input.avatarStoragePath) {
    memberPatch.avatar_url = input.avatarStoragePath;
  }

  const { error: memberError } = await admin.from("team_members").update(memberPatch).eq("id", teamMemberId);
  if (memberError) return { ok: false, error: memberError.message };

  const { error: profileError } = await admin
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
  if (profileError) return { ok: false, error: profileError.message };

  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      display_name: displayName,
      job_title: jobTitle,
      invite_profile_complete: true,
    },
  });
  if (authError) return { ok: false, error: authError.message };

  const organizationId = (profile?.organization_id as string | null) ?? null;
  if (organizationId) {
    void syncStripeSubscriptionQuantity(organizationId, "invite_profile_completed");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
