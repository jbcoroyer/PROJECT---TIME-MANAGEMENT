import { SETUP_PATH } from "../setupPaths";

export const BILLING_REQUIRED_PATH = "/billing";

/** Chemins accessibles même si l'abonnement / l'essai est expiré. */
export function isBillingExemptPath(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname === BILLING_REQUIRED_PATH || pathname.startsWith(`${BILLING_REQUIRED_PATH}/`)) {
    return true;
  }
  if (pathname === SETUP_PATH || pathname.startsWith(`${SETUP_PATH}/`)) {
    return true;
  }
  return false;
}

/** Routes API accessibles sans abonnement actif (checkout, webhooks, santé…). */
export function isBillingExemptApiPath(pathname: string): boolean {
  if (!pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/api/billing/")) return true;
  if (pathname.startsWith("/api/webhooks/")) return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (pathname === "/api/health") return true;
  if (pathname.startsWith("/api/public/")) return true;
  return false;
}
