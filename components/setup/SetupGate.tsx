"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppMark, AppWordmark } from "../AppBrand";
import { useTranslation } from "../../lib/i18n/useTranslation";

type SetupGateProps = {
  variant: "sign-in" | "pending" | "provisioning";
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
            className="ui-btn ui-btn-primary mt-8 inline-flex items-center gap-2 px-6 py-3"
          >
            {t("setup.signIn")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "provisioning") {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <AppMark className="h-16 w-16" />
          </div>
          <h1 className="ui-display text-2xl font-bold">{t("setup.provisioningTitle")}</h1>
          <p className="mt-4 text-sm text-[color:var(--foreground)]/65">{t("setup.provisioningBody")}</p>
          <Link href="/setup" className="ui-btn ui-btn-primary mt-8 inline-flex px-6 py-3">
            {t("setup.provisioningRetry")}
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
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="ui-btn ui-btn-secondary px-5 py-2.5 text-sm"
          >
            {t("setup.switchAccount")}
          </Link>
          <Link
            href="/"
            className="ui-transition text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            {t("setup.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
