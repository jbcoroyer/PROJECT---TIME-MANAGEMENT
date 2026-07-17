import { headers } from "next/headers";
import {
  checkRateLimit,
  PUBLIC_SUBMISSION_WINDOW_MS,
  PUBLIC_SUBMISSIONS_PER_HOUR,
} from "./rateLimit";

export async function getClientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

/** Retourne un message d'erreur si la limite horaire par IP est atteinte (server actions). */
export async function publicSubmissionRateLimitError(
  routeKey: string,
  limit = PUBLIC_SUBMISSIONS_PER_HOUR,
): Promise<string | null> {
  const ip = await getClientIpFromHeaders();
  const result = checkRateLimit(
    `${routeKey}:public:${ip}`,
    limit,
    PUBLIC_SUBMISSION_WINDOW_MS,
  );
  if (!result.ok) {
    return "Trop de soumissions depuis cette adresse. Réessayez plus tard.";
  }
  return null;
}
