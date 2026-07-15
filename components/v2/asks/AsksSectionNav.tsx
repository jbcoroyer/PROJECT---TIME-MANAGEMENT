"use client";

import { usePathname } from "next/navigation";
import { ClipboardList, Inbox } from "lucide-react";
import SectionNav from "../../ui/SectionNav";

export default function AsksSectionNav() {
  const pathname = usePathname();
  const hubHref = "/asks";
  const triageHref = "/asks/triage";

  const activeHref =
    pathname === triageHref || pathname.startsWith(`${triageHref}/`)
      ? triageHref
      : hubHref;

  return (
    <SectionNav
      ariaLabel="Navigation espace demandes"
      activeHref={activeHref}
      items={[
        { href: hubHref, label: "Espace demandes", icon: ClipboardList },
        { href: triageHref, label: "Traiter les demandes", icon: Inbox },
      ]}
    />
  );
}
