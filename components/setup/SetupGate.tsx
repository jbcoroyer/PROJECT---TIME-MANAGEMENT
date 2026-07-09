"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppMark, AppWordmark } from "../AppBrand";
import { useTranslation } from "../../lib/i18n/useTranslation";

type SetupGateProps = {
  variant: "sign-in" | "pending";
};

export default function SetupGate({ variant }: SetupGateProps) {
  const { t } = useTranslation({ preferBrowser: true });

  if (variant === "sign-in") {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <AppMark className="h-16 w-16" />
          </div>
          <AppWordmark size="login" />
          <p className="mt-4 text-sm text-[color:var(--foreground)]/65">{t("setup.notConfigured")}</p>
          <Link
            href="/login"
            className="ui-transition mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("setup.signIn")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <AppMark className="h-16 w-16" />
        </div>
        <h1 className="ui-display text-2xl font-bold">{t("setup.pendingTitle")}</h1>
        <p className="mt-4 text-sm text-[color:var(--foreground)]/65">{t("setup.pendingBody")}</p>
        <Link
          href="/"
          className="ui-transition mt-8 inline-block text-sm font-semibold text-[var(--brand-primary)] hover:underline"
        >
          {t("setup.backHome")}
        </Link>
      </div>
    </div>
  );
}
