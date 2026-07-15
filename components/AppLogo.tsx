"use client";

import Image from "next/image";
import { useBranding } from "../lib/brandingContext";
import { DEFAULT_APP_MARK_SRC, isDefaultAppMarkSrc } from "../lib/branding";
import { AtelierMark } from "./AtelierMark";

export { DEFAULT_APP_MARK_SRC };

type AppLogoProps = {
  /** icon = pictogramme ; wordmark = pictogramme + nom ; full = alias wordmark */
  variant?: "icon" | "wordmark" | "full";
  className?: string;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
};

function MarkImage({
  src,
  alt,
  className,
  ariaHidden,
}: {
  src: string;
  alt: string;
  className?: string;
  ariaHidden?: boolean;
}) {
  if (src.endsWith(".svg") && src.startsWith("/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- SVG local neutre
      <img
        src={src}
        alt={ariaHidden ? "" : alt}
        className={["object-contain", className].filter(Boolean).join(" ")}
        aria-hidden={ariaHidden}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={ariaHidden ? "" : alt}
      width={64}
      height={64}
      priority
      className={["object-contain", className].filter(Boolean).join(" ")}
      aria-hidden={ariaHidden}
    />
  );
}

export default function AppLogo({
  variant = "icon",
  className,
  ...props
}: AppLogoProps) {
  const { branding } = useBranding();
  const isIcon = variant === "icon";
  const alt = props["aria-hidden"] ? "" : props["aria-label"] ?? branding.appName;
  const markSrc = branding.markUrl || branding.iconUrl;

  if (isIcon) {
    if (!markSrc || isDefaultAppMarkSrc(markSrc)) {
      return <AtelierMark className={className} />;
    }
    return <MarkImage src={markSrc} alt={alt} className={className} ariaHidden={props["aria-hidden"]} />;
  }

  if (branding.logoUrl) {
    return (
      <MarkImage
        src={branding.logoUrl}
        alt={alt}
        className={["h-auto w-[min(100%,220px)]", className].filter(Boolean).join(" ")}
        ariaHidden={props["aria-hidden"]}
      />
    );
  }

  return (
    <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      {!markSrc || isDefaultAppMarkSrc(markSrc) ? (
        <AtelierMark className="h-11 w-11 shrink-0" />
      ) : (
        <MarkImage src={markSrc} alt={alt} className="h-11 w-11 shrink-0" ariaHidden={props["aria-hidden"]} />
      )}
      <span className="ui-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {branding.appName}
      </span>
    </div>
  );
}
