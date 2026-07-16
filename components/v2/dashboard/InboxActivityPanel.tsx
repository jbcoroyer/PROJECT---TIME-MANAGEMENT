"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useInAppNotifications } from "../../../lib/inAppNotificationsContext";
import { getIntlLocale } from "../../../lib/i18n/dateFnsLocale";
import { useTranslation } from "../../../lib/i18n/useTranslation";

export default function InboxActivityPanel() {
  const { t, locale } = useTranslation();
  const { history } = useInAppNotifications();
  const intlLocale = getIntlLocale(locale);

  return (
    <section className="ui-surface h-fit rounded-2xl p-5 lg:sticky lg:top-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[color:var(--foreground)]/60">
          <Bell className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">{t("dashboard.inbox.title")}</h2>
          <p className="text-xs text-[color:var(--foreground)]/55">{t("dashboard.inbox.subtitle")}</p>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-4 py-8 text-center text-xs leading-relaxed text-[color:var(--foreground)]/55">
          {t("dashboard.inbox.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {history.slice(0, 12).map((entry) => (
            <li
              key={entry.id}
              className={[
                "rounded-xl border px-3 py-2.5",
                entry.read
                  ? "border-[var(--line)] bg-[var(--surface)]"
                  : "border-[var(--line-strong)] bg-[var(--surface-soft)]",
              ].join(" ")}
            >
              <p className="text-xs font-semibold text-[var(--foreground)]">{entry.title}</p>
              {entry.body ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-[color:var(--foreground)]/60">{entry.body}</p>
              ) : null}
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-[color:var(--foreground)]/45">
                  {new Date(entry.at).toLocaleString(intlLocale, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]"
                  >
                    {t("dashboard.open")}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
