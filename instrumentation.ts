type RequestErrorContext = {
  routerKind: "Pages Router" | "App Router";
  routePath: string;
  routeType: "render" | "route" | "action" | "proxy";
};

async function loadSentry() {
  try {
    return await import("@sentry/nextjs");
  } catch (error) {
    console.warn("[instrumentation] Sentry indisponible", error);
    return null;
  }
}

export async function register() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const Sentry = await loadSentry();
  if (!Sentry) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}

export async function onRequestError(
  error: { digest?: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string | string[] | undefined };
  },
  context: RequestErrorContext,
) {
  if (!process.env.SENTRY_DSN?.trim()) return;

  const Sentry = await loadSentry();
  if (!Sentry) return;

  return Sentry.captureRequestError(error, request, context);
}
