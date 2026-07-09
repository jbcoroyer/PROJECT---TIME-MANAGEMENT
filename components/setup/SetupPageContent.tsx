"use client";

import { AppMark } from "../AppBrand";
import SetupWizard from "./SetupWizard";
import { useTranslation } from "../../lib/i18n/useTranslation";

export default function SetupPageContent() {
  const { t } = useTranslation({ preferBrowser: true });

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <AppMark className="h-14 w-14" />
          </div>
          <h1 className="ui-display text-3xl font-bold text-[var(--foreground)]">{t("setup.title")}</h1>
          <p className="mt-2 text-sm text-[color:var(--foreground)]/60">{t("setup.subtitle")}</p>
        </div>
        <SetupWizard />
      </div>
    </div>
  );
}
