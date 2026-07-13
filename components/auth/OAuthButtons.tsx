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
      <div className="relative flex items-center gap-2.5 py-1">
        <div className="flex-1 border-t border-[var(--line)]" />
        <span className="text-[11.5px] text-[color-mix(in_srgb,var(--ink)_40%,transparent)]">ou</span>
        <div className="flex-1 border-t border-[var(--line)]" />
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleGoogle()}
        className="ui-transition flex w-full items-center justify-center gap-2.5 rounded-[11px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[13.5px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-soft)] disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span
            className="h-4 w-4 shrink-0 rounded-[4px]"
            style={{
              background:
                "conic-gradient(from 90deg, oklch(0.6 0.19 45), oklch(0.58 0.11 190), oklch(0.58 0.14 300), oklch(0.6 0.19 45))",
            }}
            aria-hidden
          />
        )}
        Continuer avec Google
      </button>
    </div>
  );
}
