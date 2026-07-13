"use client";

import { LogOut } from "lucide-react";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { useTranslation } from "../../lib/i18n/useTranslation";

export default function SignOutSection() {
  const { t } = useTranslation();
  const supabase = getSupabaseBrowser();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <section
      id="settings-sign-out"
      className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("settings.signOutTitle")}</h2>
      <p className="mt-1 text-sm text-[color:var(--foreground)]/60">{t("settings.signOutHint")}</p>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="ui-btn ui-btn-ghost mt-4 gap-2 border border-[var(--line)] px-4 py-2.5 text-sm"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        {t("settings.signOut")}
      </button>
    </section>
  );
}
