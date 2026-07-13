"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getPublicAppOrigin } from "../../lib/publicAppUrl";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { toastError } from "../../lib/toast";

export default function OAuthButtons({ nextPath = "/setup" }: { nextPath?: string }) {
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      const origin = getPublicAppOrigin() || window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) throw error;
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Connexion Google impossible");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center py-1">
        <div className="flex-1 border-t border-[var(--line)]" />
        <span className="px-3 text-xs text-[color:var(--foreground)]/45">ou continuer avec</span>
        <div className="flex-1 border-t border-[var(--line)]" />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleGoogle()}
        className="ui-transition flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Google
      </button>
    </div>
  );
}
