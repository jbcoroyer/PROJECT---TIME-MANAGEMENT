"use client";

import { AppMark } from "../../AppBrand";

type IntakeFormBrandHeaderProps = {
  appName: string;
};

export default function IntakeFormBrandHeader({ appName }: IntakeFormBrandHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <AppMark className="h-9 w-9" />
      <span className="app-wordmark ui-display text-[1.75rem] text-[var(--foreground)]">{appName}</span>
    </div>
  );
}
