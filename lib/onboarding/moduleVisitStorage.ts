import { ALL_MODULE_IDS } from "../modules";
import type { AppModuleId } from "../modules/types";

const STORAGE_PREFIX = "module-visits-v1";

const VALID_IDS = new Set<string>(ALL_MODULE_IDS);

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function readVisitedModules(userId: string): Set<AppModuleId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter(
        (id): id is AppModuleId => typeof id === "string" && VALID_IDS.has(id),
      ),
    );
  } catch {
    return new Set();
  }
}

export function markModuleVisited(userId: string, moduleId: AppModuleId): Set<AppModuleId> {
  const current = readVisitedModules(userId);
  if (current.has(moduleId)) return current;
  const next = new Set(current);
  next.add(moduleId);
  window.localStorage.setItem(storageKey(userId), JSON.stringify([...next]));
  return next;
}

/** Modules hors tableau de bord qui peuvent afficher une pastille « Nouveau ». */
export const MODULE_DISCOVERY_BADGE_IDS = ALL_MODULE_IDS.filter((id) => id !== "dashboard");

export function shouldShowModuleDiscoveryBadge(
  moduleId: AppModuleId | null,
  visited: ReadonlySet<AppModuleId>,
): boolean {
  if (!moduleId || moduleId === "dashboard") return false;
  return !visited.has(moduleId);
}
