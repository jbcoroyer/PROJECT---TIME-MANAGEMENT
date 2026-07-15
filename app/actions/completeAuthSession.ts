"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendTransactionalEmail } from "../../lib/server/email";
import { syncUserDisplayName } from "../../lib/syncUserDisplayName";

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
}
