"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type SectionNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** Met en avant l’entrée principale du module (ex. dashboard stock). */
  primary?: boolean;
};

export default function SectionNav(props: {
  items: SectionNavItem[];
  activeHref: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <nav
      className={[
        "flex flex-wrap items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={props.ariaLabel}
    >
      {props.items.map((item) => {
        const Icon = item.icon;
        const active = props.activeHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "ui-nav-link ui-transition text-sm",
              active ? "ui-nav-link--active" : item.primary ? "ui-nav-link--primary" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
