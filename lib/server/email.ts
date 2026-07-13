import "server-only";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

type SendEmailResult = { ok: true } | { ok: false; error: string; skipped?: boolean };

/** Envoi transactionnel via Resend (no-op si non configuré). */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Workspace <onboarding@resend.dev>";

  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY non configuré." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || `Resend HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur envoi email" };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
