"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";

const TOUR_STORAGE_KEY = "workspace_product_tour_done";

const STEPS = [
  {
    title: "Invitez votre équipe",
    body: "Dans Réglages, envoyez des invitations par e-mail à vos collègues.",
    href: "/settings",
  },
  {
    title: "Activez vos modules",
    body: "Choisissez uniquement les modules dont vous avez besoin (événements, social, stock…).",
    href: "/settings",
  },
  {
    title: "Connectez Outlook",
    body: "Synchronisez vos tâches planifiées vers Microsoft 365 (plan Pro).",
    href: "/settings",
  },
] as const;

export default function ProductTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(TOUR_STORAGE_KEY);
    const fromSetup = window.location.search.includes("tour=1");
    if (!done || fromSetup) {
      setOpen(true);
    }
  }, []);

  function closeTour() {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  return (
    <div className="fixed bottom-4 right-4 z-[120] w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-2)]">
      <button
        type="button"
        onClick={closeTour}
        className="absolute right-3 top-3 rounded-lg p-1 text-[color:var(--foreground)]/40 hover:bg-[var(--surface-soft)]"
        aria-label="Fermer le tour"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--foreground)]/45">
        Étape {step + 1} / {STEPS.length}
      </p>
      <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">{current.title}</h3>
      <p className="mt-2 text-sm text-[color:var(--foreground)]/65">{current.body}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={closeTour}
          className="text-sm font-medium text-[color:var(--foreground)]/50 hover:text-[var(--foreground)]"
        >
          Passer
        </button>
        <div className="flex gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((value) => value - 1)}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold"
            >
              Retour
            </button>
          ) : null}
          {isLast ? (
            <Link
              href={current.href}
              onClick={closeTour}
              className="ui-btn ui-btn-primary px-3 py-2 text-sm"
            >
              Aller aux réglages
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((value) => value + 1)}
              className="ui-btn ui-btn-primary px-3 py-2 text-sm"
            >
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function markProductTourPending() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOUR_STORAGE_KEY);
}
