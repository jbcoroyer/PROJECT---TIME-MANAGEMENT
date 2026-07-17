"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Inbox } from "lucide-react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import SectionNav from "../../ui/SectionNav";

export default function AsksSectionNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const hubHref = "/asks";
  const triageHref = "/asks/triage";

  const isFormRoute = /^\/asks\/[^/]+/.test(pathname) && pathname !== triageHref;
  const activeHref =
    pathname === triageHref || pathname.startsWith(`${triageHref}/`) || pathname.endsWith("/triage")
      ? triageHref
      : hubHref;

  return (
    <div className="space-y-2">
      <SectionNav
        ariaLabel={t("asks.nav.ariaLabel")}
        activeHref={activeHref}
        items={[
          { href: hubHref, label: t("asks.nav.hub"), icon: ClipboardList },
          { href: triageHref, label: t("asks.nav.triage"), icon: Inbox },
        ]}
      />
      {isFormRoute ? (
        <p className="text-xs text-[var(--ink-muted)]">
          <Link href={hubHref} className="font-semibold text-[var(--accent)] hover:underline">
            {t("asks.nav.allForms")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
