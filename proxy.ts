import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { BILLING_REQUIRED_PATH, isBillingExemptPath } from "./lib/billing/billingPaths";
import { isBillingEnforcementEnabled } from "./lib/billing/enforcement";
import { resolveBillingAccess } from "./lib/billing/resolveBillingAccess";
import { isPlatformAdminEmail } from "./lib/server/platformAdmin";
import { isInvalidRefreshTokenError } from "./lib/supabaseAuthRecovery";

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/ideas") ||
    pathname === "/questionnaire" ||
    pathname.startsWith("/questionnaire/f/") ||
    pathname.startsWith("/asks/f/") ||
    pathname.startsWith("/agenda/b/") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pkceCode = request.nextUrl.searchParams.get("code");

  // Si Supabase renvoie le code PKCE sur /, /login ou /signup, envoyer vers le handler d'échange.
  if (pkceCode && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Toujours synchroniser / nettoyer la session (y compris pages publiques) :
  // après un wipe DB, les cookies de refresh token obsolètes saturent sinon la console.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && isInvalidRefreshTokenError(error)) {
    await supabase.auth.signOut();
  }

  if (!isPublicPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    isBillingEnforcementEnabled() &&
    !isPublicPath(pathname) &&
    !isBillingExemptPath(pathname)
  ) {
    const billing = await resolveBillingAccess(supabase, user.id);
    const platformAdmin = isPlatformAdminEmail(user.email);
    if (!billing.allowed && !platformAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = BILLING_REQUIRED_PATH;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|signup|ideas|pricing|privacy|terms|legal|api/public).*)"],
};
