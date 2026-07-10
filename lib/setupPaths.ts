export const SETUP_PATH = "/setup";
export const SIGNUP_PATH = "/signup";

/** Chemins accessibles sans redirection vers l'assistant d'installation. */
export function isSetupExemptPath(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname === SETUP_PATH) return true;
  if (pathname === SIGNUP_PATH) return true;
  if (pathname === "/" || pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/questionnaire/f/")) return true;
  return false;
}
