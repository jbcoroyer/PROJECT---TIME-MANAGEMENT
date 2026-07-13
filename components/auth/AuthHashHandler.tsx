"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";

const INVITE_ACCEPT_PATH = "/invite/accept";

/**
 * Traite les jetons Supabase passés en hash (#access_token) quand le lien
 * n'atteint pas /auth/callback (prévisualisation mail, ancienne config, etc.).
 */
export default function AuthHashHandler() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) return;

    let cancelled = false;

    void (async () => {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (cancelled || sessionError) return;
      window.history.replaceState(null, "", window.location.pathname + window.location.search);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isInvite =
        type === "invite" ||
        type === "signup" ||
        user?.user_metadata?.invited === true;

      if (isInvite && user?.user_metadata?.invite_profile_complete !== true) {
        router.replace(INVITE_ACCEPT_PATH);
        return;
      }
      if (type === "recovery") {
        router.replace("/login/reset-password");
        return;
      }
      router.replace("/");
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return null;
}
