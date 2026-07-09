/** Clés de stockage local : noms neutres avec repli sur les anciennes clés IDENA. */

export const APP_VERSION_STORAGE_KEY = "app-version";
const LEGACY_APP_VERSION_STORAGE_KEY = "idena-app-version";

export const AUTOMATION_PROCESSED_SESSION_KEY = "app-automation-processed";
const LEGACY_AUTOMATION_PROCESSED_SESSION_KEY = "idena-automation-processed";

export const INAPP_NOTIFICATION_STORAGE_PREFIX = "app-inapp-notif";
const LEGACY_INAPP_NOTIFICATION_STORAGE_PREFIX = "idena-inapp-notif";

export function readStorageItem(primaryKey: string, legacyKey?: string): string | null {
  if (typeof window === "undefined") return null;
  const primary = window.localStorage.getItem(primaryKey);
  if (primary != null) return primary;
  if (!legacyKey) return null;
  const legacy = window.localStorage.getItem(legacyKey);
  if (legacy != null) {
    window.localStorage.setItem(primaryKey, legacy);
    window.localStorage.removeItem(legacyKey);
  }
  return legacy;
}

export function readSessionItem(primaryKey: string, legacyKey?: string): string | null {
  if (typeof window === "undefined") return null;
  const primary = window.sessionStorage.getItem(primaryKey);
  if (primary != null) return primary;
  if (!legacyKey) return null;
  const legacy = window.sessionStorage.getItem(legacyKey);
  if (legacy != null) {
    window.sessionStorage.setItem(primaryKey, legacy);
    window.sessionStorage.removeItem(legacyKey);
  }
  return legacy;
}

export function writeStorageItem(primaryKey: string, value: string, legacyKey?: string) {
  window.localStorage.setItem(primaryKey, value);
  if (legacyKey) window.localStorage.removeItem(legacyKey);
}

export function writeSessionItem(primaryKey: string, value: string, legacyKey?: string) {
  window.sessionStorage.setItem(primaryKey, value);
  if (legacyKey) window.sessionStorage.removeItem(legacyKey);
}

export function readAppVersionPreference(): string | null {
  return readStorageItem(APP_VERSION_STORAGE_KEY, LEGACY_APP_VERSION_STORAGE_KEY);
}

export function writeAppVersionPreference(value: string) {
  writeStorageItem(APP_VERSION_STORAGE_KEY, value, LEGACY_APP_VERSION_STORAGE_KEY);
}

export function inAppNotificationStorageKey(parts: string[]): string {
  const suffix = parts.join(":");
  const legacy = `${LEGACY_INAPP_NOTIFICATION_STORAGE_PREFIX}:${suffix}`;
  const primary = `${INAPP_NOTIFICATION_STORAGE_PREFIX}:${suffix}`;
  if (typeof window !== "undefined" && !window.localStorage.getItem(primary) && window.localStorage.getItem(legacy)) {
    window.localStorage.setItem(primary, window.localStorage.getItem(legacy)!);
    window.localStorage.removeItem(legacy);
  }
  return primary;
}
