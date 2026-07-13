"use client";

import { AppMark } from "../AppBrand";
import SetupWizard from "./SetupWizard";
import { useBranding } from "../../lib/brandingContext";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./setup-onboarding.css";

export default function SetupPageContent() {
  const { t } = useTranslation({ preferBrowser: true });
  const { branding, loading: brandingLoading } = useBranding();
  const { user, loading: userLoading } = useCurrentUser();
  const primary = branding.primaryColor || "oklch(0.6 0.19 45)";

  const ready = !brandingLoading && !userLoading && Boolean(user?.organizationId ?? branding.organizationId);

  if (!ready) {
    return (
      <div className="setup-ambient flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-pulse rounded-full bg-[var(--surface-soft)]" />
          <p className="text-sm text-[color:var(--foreground)]/50">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const greeting = user?.displayName?.split(" ")[0] ?? null;

  return (
    <div
      className="setup-ambient min-h-screen px-4 py-8 sm:px-6 sm:py-10"
      style={{ ["--brand-primary" as string]: primary }}
    >
      <div className="setup-shell relative z-[1] mx-auto w-full max-w-[620px]">
        <header className="setup-header mb-8 sm:mb-10">
          <div className="mb-6 flex items-center gap-3">
            <AppMark className="h-10 w-10" />
            <span className="ui-kicker">{t("setup.title")}</span>
          </div>

          <h1 className="ui-display text-[1.75rem] font-bold leading-[1.15] tracking-tight text-[var(--foreground)] sm:text-[2rem]">
            {greeting ? t("setup.welcomeUser", { name: greeting }) : t("setup.welcomeHeadline")}
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[color:var(--foreground)]/62">
            {t("setup.welcomeBody")}
          </p>

          <ol className="setup-progress-steps mt-8 hidden gap-0 sm:flex">
            {[
              t("setup.step1Title"),
              t("setup.step2Title"),
              t("setup.step3Title"),
              t("setup.step4Title"),
            ].map((label, index) => (
              <li key={label} className="setup-progress-steps__item">
                <span className="setup-progress-steps__index">{index + 1}</span>
                <span className="setup-progress-steps__label">{label}</span>
              </li>
            ))}
          </ol>
        </header>

        <SetupWizard />
      </div>
    </div>
  );
}
