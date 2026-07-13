"use client";

import { AppMark } from "../AppBrand";
import SetupWizard from "./SetupWizard";
import { useBranding } from "../../lib/brandingContext";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./setup-onboarding.css";

export default function SetupPageContent() {
  const { t } = useTranslation({ preferBrowser: true });
  const { branding } = useBranding();
  const primary = branding.primaryColor || "#6366f1";

  return (
    <div
      className="setup-ambient px-4 py-8 lg:px-10 lg:py-12"
      style={{ ["--brand-primary" as string]: primary }}
    >
      <div className="setup-shell mx-auto w-full max-w-5xl">
        <header className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <span
                className="absolute inset-0 -m-3 rounded-3xl bg-[color:var(--brand-primary)]/12 blur-xl"
                aria-hidden
              />
              <AppMark className="relative h-16 w-16 drop-shadow-sm" />
            </div>
          </div>
          <h1 className="ui-display text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {t("setup.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[color:var(--foreground)]/58">
            {t("setup.subtitle")}
          </p>
        </header>
        <SetupWizard />
      </div>
    </div>
  );
}
