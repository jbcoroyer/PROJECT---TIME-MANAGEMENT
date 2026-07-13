"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { canAccessPlatformAdmin } from "../../app/actions/platform";

export default function PlatformAdminShortcut() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void canAccessPlatformAdmin().then(setVisible);
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/platform"
      className="ui-transition flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
    >
      <Shield className="h-4 w-4 text-[var(--brand-primary)]" />
      Administration plateforme
    </Link>
  );
}
