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
