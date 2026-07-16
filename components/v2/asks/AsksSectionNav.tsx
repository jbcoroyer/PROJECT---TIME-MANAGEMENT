"use client";

import { usePathname } from "next/navigation";
import { ClipboardList, Inbox } from "lucide-react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import SectionNav from "../../ui/SectionNav";

export default function AsksSectionNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const hubHref = "/asks";
  const triageHref = "/asks/triage";

  const activeHref =
    pathname === triageHref || pathname.startsWith(`${triageHref}/`)
      ? triageHref
      : hubHref;

  return (
    <SectionNav
      ariaLabel={t("asks.nav.ariaLabel")}
      activeHref={activeHref}
      items={[
        { href: hubHref, label: t("asks.nav.hub"), icon: ClipboardList },
        { href: triageHref, label: t("asks.nav.triage"), icon: Inbox },
      ]}
    />
  );
}
