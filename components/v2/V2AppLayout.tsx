"use client";

import { Suspense, type ReactNode } from "react";
import V2AppShell from "./AppShell";
import ModuleRouteGuard from "./ModuleRouteGuard";
import ProductTour from "../onboarding/ProductTour";
import { V2ShellSlotsProvider, useV2ShellSlots } from "../../lib/v2/shellSlotsContext";

function V2AppShellWithSlots({ children }: { children: ReactNode }) {
  const { toolbarRight, searchSlot } = useV2ShellSlots();
  return (
    <ModuleRouteGuard>
      <V2AppShell toolbarRight={toolbarRight ?? undefined} searchSlot={searchSlot ?? undefined}>
        {children}
      </V2AppShell>
    </ModuleRouteGuard>
  );
}

export default function V2AppLayout({ children }: { children: ReactNode }) {
  return (
    <V2ShellSlotsProvider>
      <V2AppShellWithSlots>{children}</V2AppShellWithSlots>
      <Suspense fallback={null}>
        <ProductTour />
      </Suspense>
    </V2ShellSlotsProvider>
  );
}
