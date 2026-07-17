"use client";

import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Package } from "lucide-react";
import { useTranslation } from "../lib/i18n/useTranslation";
import SectionNav from "./ui/SectionNav";

export default function StockSectionNav({ basePath = "/stock" }: { basePath?: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const dashboardHref = `${basePath}/dashboard`;
  const historyHref = `${basePath}/history`;
  const inventoryHref = basePath;

  const activeHref =
    pathname === dashboardHref || pathname.startsWith(`${dashboardHref}/`)
      ? dashboardHref
      : pathname === historyHref || pathname.startsWith(`${historyHref}/`)
        ? historyHref
        : inventoryHref;

  const items = [
    {
      href: dashboardHref,
      label: t("stock.nav.dashboard"),
      icon: BarChart3,
      primary: true,
    },
    {
      href: inventoryHref,
      label: t("stock.nav.inventory"),
      icon: Package,
    },
    {
      href: historyHref,
      label: t("stock.nav.history"),
      icon: ClipboardList,
    },
  ];

  return <SectionNav items={items} activeHref={activeHref} ariaLabel={t("stock.nav.ariaLabel")} />;
}
