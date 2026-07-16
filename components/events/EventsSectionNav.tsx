"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles } from "lucide-react";
import SectionNav from "../ui/SectionNav";
import { useTranslation } from "../../lib/i18n/useTranslation";

type EventsSectionNavProps = {
  basePath?: string;
  showRetex?: boolean;
};

export default function EventsSectionNav({ basePath = "/events", showRetex = false }: EventsSectionNavProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const dashboardHref = `${basePath}/dashboard`;
  const retexHref = `${basePath}/retex`;

  const activeHref =
    pathname === dashboardHref || pathname === basePath
      ? dashboardHref
      : pathname === retexHref
        ? retexHref
        : "";

  const items = [
    { href: dashboardHref, label: t("eventsLegacy.nav.hub"), icon: LayoutDashboard },
    ...(showRetex ? [{ href: retexHref, label: "RETEX", icon: Sparkles }] : []),
  ];

  return (
    <SectionNav items={items} activeHref={activeHref} ariaLabel={t("eventsLegacy.nav.ariaLabel")} />
  );
}
