"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";

export default function UpgradeProBanner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const upgrade = searchParams.get("upgrade");
  const show = upgrade === "module";

  if (!show) return null;

  return (
    <div className="relative rounded-2xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3 pr-8">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div>
          <p className="font-semibold text-[var(--foreground)]">Module non activé</p>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/65">
            Activez ce module dans les réglages de votre espace.
          </p>
          <Link
            href="/settings#settings-modules"
            className="mt-3 inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Gérer les modules
          </Link>
        </div>
      </div>
      <Link
        href="/settings"
        className="absolute right-3 top-3 rounded-lg p-1 text-[color:var(--foreground)]/40 hover:bg-[var(--surface-soft)]"
        aria-label={t("upgrade.close")}
      >
        <X className="h-4 w-4" />
      </Link>
    </div>
  );
}
