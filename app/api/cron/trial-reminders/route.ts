import { NextResponse } from "next/server";
import { internalApiUnauthorized, verifyInternalApiSecret } from "../../../../lib/server/internalApiAuth";
import { daysLeftInTrial, TRIAL_DAYS } from "../../../../lib/billing/plans";
import { listTrialingOrganizations } from "../../../../lib/server/billingOrg";
import { listOrganizationAdminEmails } from "../../../../lib/server/orgMembers";
import { sendTransactionalEmail } from "../../../../lib/server/email";

export const runtime = "nodejs";

function trialReminderHtml(orgName: string, daysLeft: number): string {
  const urgency =
    daysLeft <= 1
      ? "Votre essai gratuit se termine demain."
      : `Il vous reste ${daysLeft} jours d'essai gratuit.`;
  return `
    <p>Bonjour,</p>
    <p>${urgency}</p>
    <p>Pour l'espace <strong>${orgName}</strong> : souscrivez à l'abonnement unique (2&nbsp;€/utilisateur/mois, min. 10&nbsp;€) pour continuer après l'essai ({TRIAL_DAYS} jours gratuits, sans carte).</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "http://localhost:3000"}/pricing">Voir les tarifs</a></p>
  `;
}

/** Rappels essai J-3 et J-1 — protégé par INTERNAL_API_SECRET. */
export async function GET(request: Request) {
  if (!verifyInternalApiSecret(request)) {
    return internalApiUnauthorized();
  }

  const orgs = await listTrialingOrganizations();
  let sent = 0;
  const errors: string[] = [];

  for (const org of orgs) {
    const daysLeft = daysLeftInTrial(org.trialEndsAt);
    if (daysLeft === null || (daysLeft !== 3 && daysLeft !== 1)) continue;

    const admins = await listOrganizationAdminEmails(org.id);
    if (!admins.length) continue;

    const subject =
      daysLeft <= 1
        ? `[Workspace] Votre essai se termine demain — ${org.name}`
        : `[Workspace] Plus que 3 jours d'essai — ${org.name}`;

    for (const email of admins) {
      const result = await sendTransactionalEmail({
        to: email,
        subject,
        html: trialReminderHtml(org.name, daysLeft),
      });
      if (result.ok) {
        sent += 1;
      } else if (!result.skipped) {
        errors.push(`${email}: ${result.error}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    organizationsChecked: orgs.length,
    emailsSent: sent,
    errors,
  });
}
