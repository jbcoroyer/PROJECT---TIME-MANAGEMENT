"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";

export type EventDetailTabItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

type EventDetailTabsProps<T extends string> = {
  items: readonly EventDetailTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
};

export default function EventDetailTabs<T extends string>({
  items,
  active,
  onChange,
}: EventDetailTabsProps<T>) {
  const { t } = useTranslation();

  return (
    <nav
      className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 lg:grid-cols-4"
      role="tablist"
      aria-label={t("eventsLegacy.detail.ariaSections")}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={[
              "ui-transition inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
              isActive
                ? "bg-[var(--foreground)] text-[var(--accent-contrast)] shadow-sm"
                : "text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]",
            ].join(" ")}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
