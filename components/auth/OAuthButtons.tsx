"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getPublicAppOrigin } from "../../lib/publicAppUrl";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { toastError } from "../../lib/toast";

type OAuthProvider = "google" | "azure";

const PROVIDERS: { id: OAuthProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "azure", label: "Microsoft" },
];

export default function OAuthButtons({ nextPath = "/setup" }: { nextPath?: string }) {
  const [busy, setBusy] = useState<OAuthProvider | null>(null);

  async function handleOAuth(provider: OAuthProvider) {
    setBusy(provider);
    try {
      const supabase = getSupabaseBrowser();
      const origin = getPublicAppOrigin() || window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: provider === "azure" ? "email openid profile" : undefined,
        },
      });

      if (error) throw error;
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Connexion OAuth impossible");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center py-1">
        <div className="flex-1 border-t border-[var(--line)]" />
        <span className="px-3 text-xs text-[color:var(--foreground)]/45">ou continuer avec</span>
        <div className="flex-1 border-t border-[var(--line)]" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            disabled={busy !== null}
            onClick={() => void handleOAuth(id)}
            className="ui-transition flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-60"
          >
            {busy === id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
