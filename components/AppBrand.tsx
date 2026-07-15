"use client";

import type { ReactNode } from "react";
import AppLogo from "./AppLogo";
import { AtelierMark } from "./AtelierMark";
import { useBranding } from "../lib/brandingContext";
import { isDefaultAppMarkSrc, isExternalImageSrc } from "../lib/branding";

export function AppMark({
  className = "h-9 w-9",
  starOnDark = false,
}: {
  className?: string;
  starOnDark?: boolean;
}) {
  const { branding } = useBranding();
  const src = branding.markUrl || branding.iconUrl;

  if (src && isExternalImageSrc(src)) {
    return (
      <div
        className={[
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface)] ring-1 ring-[var(--line)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pictogramme personnalisé (URL externe) */}
        <img
          src={src}
          alt={branding.appName}
          className="h-full w-full object-contain object-center"
        />
      </div>
    );
  }

  if (src && !isDefaultAppMarkSrc(src)) {
    return <AppLogo variant="icon" className={className} aria-label={branding.appName} />;
  }

  return <AtelierMark className={className} starOnDark={starOnDark} />;
}

type WordmarkSize = "sidebar" | "login" | "compact";

export function AppWordmark({ size = "sidebar" }: { size?: WordmarkSize }) {
  const { branding } = useBranding();
  const sizeClass =
    size === "login"
      ? "text-[2.75rem] sm:text-[3.25rem]"
      : size === "compact"
        ? "text-xl"
        : "text-[1.75rem] sm:text-[1.9rem]";

  return (
    <span
      className={["app-wordmark ui-display text-[var(--foreground)]", sizeClass].join(" ")}
      aria-label={branding.appName}
    >
      {branding.appName}
    </span>
  );
}

type BrandHeadingProps = {
  size?: "sidebar" | "login";
  children?: ReactNode;
};

export function BrandHeading({ size = "sidebar", children }: BrandHeadingProps) {
  const { branding } = useBranding();
  const tagline = branding.tagline.trim();
  const isLogin = size === "login";

  if (isLogin) {
    return (
      <div className="mb-10 text-center">
        <div className="mb-5 flex justify-center">
          <AppMark className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" />
        </div>
        <AppWordmark size="login" />
        {tagline ? <p className="ui-kicker mt-3">{tagline}</p> : null}
        {children}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <AppMark className="mt-0.5 h-10 w-10" />
        <div className="min-w-0">
          <AppWordmark size="sidebar" />
          {tagline ? (
            <p className="mt-1 text-[11px] font-medium tracking-[0.08em] text-[color:var(--foreground)]/50">
              {tagline}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
