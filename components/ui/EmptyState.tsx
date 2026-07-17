"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type EmptyStateProps = {
  title: string;
  description: string;
  /** Libellé du CTA (bouton ou lien). */
  actionLabel?: string;
  /** Action au clic — prioritaire sur `actionHref`. */
  onAction?: () => void;
  /** Lien de navigation si pas de `onAction`. */
  actionHref?: string;
  icon?: LucideIcon;
  /** Contenu CTA libre (remplace actionLabel / onAction / actionHref). */
  action?: ReactNode;
  className?: string;
  /** Variante plus compacte (colonnes, panneaux latéraux). */
  compact?: boolean;
};

/**
 * État vide Atelier — titre, bénéfice du module, CTA de création.
 * Tokens uniquement (--surface, --line, --ink-muted, --accent…).
 */
export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon: Icon,
  action,
  className = "",
  compact = false,
}: EmptyStateProps) {
  const cta =
    action ??
    (actionLabel && onAction ? (
      <button type="button" onClick={onAction} className="ui-btn ui-btn-primary gap-2 text-sm">
        {actionLabel}
      </button>
    ) : actionLabel && actionHref ? (
      <Link href={actionHref} className="ui-btn ui-btn-primary gap-2 text-sm">
        {actionLabel}
      </Link>
    ) : null);

  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        "rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)]",
        compact ? "px-4 py-10" : "px-6 py-14 sm:px-10 sm:py-16",
        className,
      ].join(" ")}
      role="status"
    >
      {Icon ? (
        <span
          className={[
            "mb-3 inline-flex items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent)]",
            "border border-[var(--line)]",
            compact ? "h-10 w-10" : "h-12 w-12",
          ].join(" ")}
          aria-hidden
        >
          <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
        </span>
      ) : null}
      <h3
        className={[
          "font-semibold text-[var(--foreground)]",
          compact ? "text-sm" : "text-base sm:text-lg",
        ].join(" ")}
      >
        {title}
      </h3>
      <p
        className={[
          "mt-1.5 max-w-md text-[var(--ink-muted)]",
          compact ? "text-xs leading-relaxed" : "text-sm leading-relaxed",
        ].join(" ")}
      >
        {description}
      </p>
      {cta ? <div className={compact ? "mt-4" : "mt-6"}>{cta}</div> : null}
    </div>
  );
}
