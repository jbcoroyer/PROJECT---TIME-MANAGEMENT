"use client";

import Link from "next/link";
import { useTranslation } from "../../lib/i18n/useTranslation";

export default function LegalFooter() {
  const { t } = useTranslation({ preferBrowser: true });

  return (
    <footer className="mt-8 border-t border-[var(--line)] pt-6 text-center text-xs text-[color:var(--foreground)]/45">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/legal" className="hover:text-[color:var(--foreground)]/70 hover:underline">
          {t("legal.footer.legal")}
        </Link>
        <Link href="/privacy" className="hover:text-[color:var(--foreground)]/70 hover:underline">
          {t("legal.footer.privacy")}
        </Link>
        <Link href="/terms" className="hover:text-[color:var(--foreground)]/70 hover:underline">
          {t("legal.footer.terms")}
        </Link>
        <Link href="/pricing" className="hover:text-[color:var(--foreground)]/70 hover:underline">
          {t("legal.footer.pricing")}
        </Link>
      </nav>
      <p className="mt-3">{t("legal.footer.gdpr")}</p>
    </footer>
  );
}
