"use client";

import { Building2 } from "lucide-react";
import { useResolvedStorageUrl } from "../lib/useResolvedStorageUrl";

type CompanyAvatarProps = {
  name?: string | null;
  logoUrl?: string | null;
  className: string;
  fallbackClassName: string;
  iconClassName?: string;
};

export default function CompanyAvatar(props: CompanyAvatarProps) {
  const { name, logoUrl, className, fallbackClassName, iconClassName = "h-4 w-4" } = props;
  const resolvedLogo = useResolvedStorageUrl("company-logos", logoUrl);
  if (resolvedLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedLogo}
        alt={name ?? "Logo société"}
        className={className}
      />
    );
  }

  return (
    <div className={fallbackClassName}>
      <Building2 className={iconClassName} />
    </div>
  );
}
