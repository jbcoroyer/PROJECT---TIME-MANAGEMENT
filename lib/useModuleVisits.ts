"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  markModuleVisited,
  readVisitedModules,
  shouldShowModuleDiscoveryBadge,
} from "./onboarding/moduleVisitStorage";
import { resolveModuleForPath } from "./modules";
import type { AppModuleId } from "./modules/types";

export function useModuleVisits(userId: string | undefined) {
  const pathname = usePathname();
  const [visited, setVisited] = useState<Set<AppModuleId>>(() =>
    userId ? readVisitedModules(userId) : new Set(),
  );
  const [trackedUserId, setTrackedUserId] = useState(userId);
  if (userId !== trackedUserId) {
    setTrackedUserId(userId);
    setVisited(userId ? readVisitedModules(userId) : new Set());
  }

  useEffect(() => {
    if (!userId) return;
    const moduleId = resolveModuleForPath(pathname);
    if (!moduleId) return;
    queueMicrotask(() => {
      setVisited((prev) => {
        if (prev.has(moduleId)) return prev;
        return markModuleVisited(userId, moduleId);
      });
    });
  }, [userId, pathname]);

  const showDiscoveryBadge = useCallback(
    (moduleId: AppModuleId | null) => shouldShowModuleDiscoveryBadge(moduleId, visited),
    [visited],
  );

  return { showDiscoveryBadge, visitedModules: visited };
}
