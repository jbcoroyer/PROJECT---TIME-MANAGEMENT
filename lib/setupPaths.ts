import { BILLING_REQUIRED_PATH } from "./billing/billingPaths";

export const SETUP_PATH = "/setup";
export const SIGNUP_PATH = "/signup";
export const INVITE_ACCEPT_PATH = "/invite/accept";

/** Chemins accessibles sans redirection vers l'assistant d'installation. */
export function isSetupExemptPath(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname === SETUP_PATH) return true;
  if (pathname === SIGNUP_PATH) return true;
  if (pathname === INVITE_ACCEPT_PATH || pathname.startsWith("/invite/")) return true;
  if (pathname === BILLING_REQUIRED_PATH || pathname.startsWith(`${BILLING_REQUIRED_PATH}/`)) {
    return true;
  }
  if (pathname === "/" || pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/questionnaire/f/")) return true;
  return false;
}
