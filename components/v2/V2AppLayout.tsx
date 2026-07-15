"use client";

import { Suspense, type ReactNode } from "react";
import V2AppShell from "./AppShell";
import ModuleRouteGuard from "./ModuleRouteGuard";
import ProductTour from "../onboarding/ProductTour";
import FirstTaskTutorial from "../onboarding/FirstTaskTutorial";
import { FirstTaskTutorialProvider } from "../../lib/onboarding/firstTaskTutorialContext";
import { GamificationProvider, useGamificationOptional } from "../../lib/gamification/gamificationContext";
import { V2ShellSlotsProvider, useV2ShellSlots } from "../../lib/v2/shellSlotsContext";
import { useCurrentUser } from "../../lib/useCurrentUser";

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

function OnboardingOverlays() {
  const { user, loading } = useCurrentUser();
  const gamification = useGamificationOptional();
  const firstTaskDone =
    user?.firstTaskTutorialCompleted || gamification?.profile.firstTaskTutorialCompleted;
  const showProductTour = !loading && Boolean(firstTaskDone);

  return (
    <>
      <Suspense fallback={null}>
        <FirstTaskTutorial />
      </Suspense>
      {showProductTour ? (
        <Suspense fallback={null}>
          <ProductTour />
        </Suspense>
      ) : null}
    </>
  );
}

export default function V2AppLayout({ children }: { children: ReactNode }) {
  return (
    <GamificationProvider>
      <FirstTaskTutorialProvider>
        <V2ShellSlotsProvider>
          <V2AppShellWithSlots>{children}</V2AppShellWithSlots>
          <OnboardingOverlays />
        </V2ShellSlotsProvider>
      </FirstTaskTutorialProvider>
    </GamificationProvider>
  );
}
