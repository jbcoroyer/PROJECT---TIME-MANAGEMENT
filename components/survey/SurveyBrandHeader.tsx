"use client";

import AppLogo from "../AppLogo";
import { useBranding } from "../../lib/brandingContext";

type SurveyBrandHeaderProps = {
  /** header = barre du haut ; hero = écran d'accueil */
  variant?: "header" | "hero";
};

export default function SurveyBrandHeader({ variant = "header" }: SurveyBrandHeaderProps) {
  const { branding } = useBranding();
  const isHero = variant === "hero";

  if (isHero) {
    return (
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
        <AppLogo
          variant="wordmark"
          className="text-[var(--foreground)]"
          aria-label={branding.appName}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <AppLogo variant="icon" className="h-11 w-11 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none tracking-tight text-[var(--foreground)]">
          {branding.appName}
        </p>
      </div>
    </div>
  );
}
