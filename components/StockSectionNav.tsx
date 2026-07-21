"use client";

import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Package, Settings2 } from "lucide-react";
import { useTranslation } from "../lib/i18n/useTranslation";
import SectionNav from "./ui/SectionNav";

export default function StockSectionNav({ basePath = "/stock" }: { basePath?: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const dashboardHref = `${basePath}/dashboard`;
  const historyHref = `${basePath}/history`;
  const settingsHref = `${basePath}/settings`;
  const inventoryHref = basePath;

  const activeHref =
    pathname === settingsHref || pathname.startsWith(`${settingsHref}/`)
      ? settingsHref
      : pathname === dashboardHref || pathname.startsWith(`${dashboardHref}/`)
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
    {
      href: settingsHref,
      label: t("stock.nav.settings"),
      icon: Settings2,
    },
  ];

  return <SectionNav items={items} activeHref={activeHref} ariaLabel={t("stock.nav.ariaLabel")} />;
}
