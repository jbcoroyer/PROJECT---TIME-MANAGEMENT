"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { needsInviteProfileCompletion } from "../../lib/inviteOnboarding";
import { sendTransactionalEmail } from "../../lib/server/email";
import { syncStripeSubscriptionQuantity } from "../../lib/server/stripeSubscriptionSync";
import { SETUP_PATH, INVITE_ACCEPT_PATH } from "../../lib/setupPaths";
import { syncUserDisplayName } from "../../lib/syncUserDisplayName";
import { getSetupAccess } from "./setup";

async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

async function sendWelcomeIfNeeded(type: string | null) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return;

  const isInvite = type === "invite" || user.user_metadata?.invited === true;
  if (!isInvite) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  await sendTransactionalEmail({
    to: user.email,
    subject: "Bienvenue dans votre espace Workspace",
    html: `<p>Votre compte est prêt. <a href="${baseUrl}/invite/accept">Compléter votre profil</a></p>`,
  });
}

/** Post-traitement après échange OAuth / OTP (nom Google, email invitation). */
export async function completeAuthSession(type: string | null = null) {
  const supabase = await createSupabaseServer();
  await syncUserDisplayName(supabase);
  await sendWelcomeIfNeeded(type);

  const isInvite = type === "invite";
  if (isInvite) {
    const access = await getSetupAccess();
    if (access.organizationId) {
      void syncStripeSubscriptionQuantity(access.organizationId, "invite_auth_completed");
    }
  }
}

/** Où envoyer l'utilisateur après connexion (nouveau compte Google → installation). */
export async function resolvePostAuthRedirect(fallbackPath: string): Promise<string> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";
  if (needsInviteProfileCompletion(user)) return INVITE_ACCEPT_PATH;

  // Laisse le temps au trigger handle_new_user de créer profil + organisation.
  let access = await getSetupAccess();
  for (let attempt = 0; attempt < 6 && !access.organizationId; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    access = await getSetupAccess();
  }

  if (!access.isConfigured) return SETUP_PATH;

  const safeFallback = fallbackPath.startsWith("/") ? fallbackPath : "/dashboard";
  return safeFallback;
}
