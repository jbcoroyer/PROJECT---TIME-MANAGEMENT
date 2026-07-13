"use server";

import { revalidatePath } from "next/cache";
import { canAddOrgMember, type OrgPlan } from "../../lib/billing/plans";
import { getOrganizationBilling } from "../../lib/server/billingOrg";
import { countOrganizationMembers } from "../../lib/server/orgMembers";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { sendTransactionalEmail } from "../../lib/server/email";

export type InviteTeamMemberResult =
  | { ok: true }
  | { ok: false; error: string };

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

  const org = await getOrganizationBilling(ctx.organizationId);
  const plan = (org?.plan ?? "trial") as OrgPlan;
  const memberCount = await countOrganizationMembers(ctx.organizationId);

  if (!canAddOrgMember(plan, memberCount)) {
    return {
      ok: false,
      error: "Limite de membres atteinte pour votre plan. Passez au plan Pro pour inviter plus de collègues.",
    };
  }

  const role = input.role === "admin" ? "admin" : "user";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const admin = createSupabaseAdmin();

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent("/setup")}`,
    data: {
      organization_id: ctx.organizationId,
      role,
      invited: true,
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
    subject: "Invitation à rejoindre un espace Workspace",
    html: `<p>Vous avez été invité(e) à rejoindre un espace Workspace.</p><p>Ouvrez l'e-mail d'invitation Supabase pour définir votre mot de passe et accéder à l'espace.</p>`,
  });

  revalidatePath("/settings");
  return { ok: true };
}
