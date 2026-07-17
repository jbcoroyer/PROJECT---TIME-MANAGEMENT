"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";

const CONSENT_KEY = "cookie-consent";

function readNeedsConsent(): boolean {
  try {
    return !localStorage.getItem(CONSENT_KEY);
  } catch {
    return true;
  }
}

export default function CookieBanner() {
  const { t } = useTranslation({ preferBrowser: true });
  const [dismissed, setDismissed] = useState(false);
  const needsConsent = useSyncExternalStore(
    () => () => undefined,
    readNeedsConsent,
    () => false,
  );
  const visible = needsConsent && !dismissed;

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  function decline() {
    try {
      localStorage.setItem(CONSENT_KEY, "essential-only");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("legal.cookie.ariaLabel")}
      className="ui-popup-panel fixed inset-x-3 bottom-3 z-[var(--z-overlay)] rounded-2xl p-4 sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-full sm:max-w-4xl sm:-translate-x-1/2 sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-sm font-semibold text-[var(--foreground)]">{t("legal.cookie.title")}</p>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/65">
            {t("legal.cookie.body")}{" "}
            <Link href="/privacy" className="font-medium text-[var(--brand-primary)] hover:underline">
              {t("legal.cookie.privacyLink")}
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={decline}
            className="ui-transition rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
          >
            {t("legal.cookie.essentialOnly")}
          </button>
          <button type="button" onClick={accept} className="ui-btn ui-btn-primary px-4 py-2 text-sm">
            {t("legal.cookie.acceptAll")}
          </button>
          <button
            type="button"
            onClick={decline}
            aria-label={t("legal.cookie.close")}
            className="rounded-lg p-1.5 text-[color:var(--foreground)]/40 hover:bg-[var(--surface-soft)] sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
