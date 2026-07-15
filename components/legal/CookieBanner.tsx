"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const CONSENT_KEY = "cookie-consent";

function readNeedsConsent(): boolean {
  try {
    return !localStorage.getItem(CONSENT_KEY);
  } catch {
    return true;
  }
}

export default function CookieBanner() {
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
      aria-label="Consentement cookies"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--line)] bg-[var(--surface)]/95 p-4 shadow-[var(--shadow-2)] backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-sm font-semibold text-[var(--foreground)]">Cookies & confidentialité</p>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/65">
            Nous utilisons des cookies strictement nécessaires au fonctionnement du service (session,
            préférences) et, avec votre accord, des cookies de mesure d&apos;audience. Consultez notre{" "}
            <Link href="/privacy" className="font-medium text-[var(--brand-primary)] hover:underline">
              politique de confidentialité
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
            Essentiels uniquement
          </button>
          <button
            type="button"
            onClick={accept}
            className="ui-btn ui-btn-primary px-4 py-2 text-sm"
          >
            Tout accepter
          </button>
          <button
            type="button"
            onClick={decline}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-[color:var(--foreground)]/40 hover:bg-[var(--surface-soft)] sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
