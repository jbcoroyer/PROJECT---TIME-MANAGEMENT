import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type AppointmentConfirmationEmailInput = {
  guestName: string;
  appName: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  meetingUrl?: string;
  customMessage?: string;
};

export type AppointmentRejectionEmailInput = {
  guestName: string;
  appName: string;
  startsAt: string;
  rejectionReason?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSlotRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return startsAt;
  return `${format(start, "EEEE d MMMM yyyy · HH:mm", { locale: fr })} – ${format(end, "HH:mm", { locale: fr })}`;
}

export function buildAppointmentConfirmationEmail(input: AppointmentConfirmationEmailInput): {
  subject: string;
  html: string;
} {
  const guestName = escapeHtml(input.guestName.trim() || "Bonjour");
  const appName = escapeHtml(input.appName.trim() || "Workspace");
  const slot = escapeHtml(formatSlotRange(input.startsAt, input.endsAt));
  const location = input.location?.trim();
  const meetingUrl = input.meetingUrl?.trim();
  const customMessage = input.customMessage?.trim();

  const details: string[] = [
    `<p style="margin:0 0 8px;">Votre rendez-vous avec <strong>${appName}</strong> est confirmé.</p>`,
    `<p style="margin:0 0 16px;"><strong>Date et heure :</strong> ${slot}</p>`,
  ];

  if (location) {
    details.push(
      `<p style="margin:0 0 8px;"><strong>Lieu :</strong> ${escapeHtml(location)}</p>`,
    );
  }

  if (meetingUrl) {
    const safeUrl = escapeHtml(meetingUrl);
    details.push(
      `<p style="margin:0 0 16px;"><strong>Visioconférence :</strong> <a href="${safeUrl}" style="color:#0d9488;">${safeUrl}</a></p>`,
    );
  }

  if (customMessage) {
    details.push(
      `<div style="margin:16px 0;padding:12px 14px;border-left:4px solid #0d9488;background:#f8fafc;border-radius:8px;">${escapeHtml(customMessage).replace(/\n/g, "<br />")}</div>`,
    );
  }

  details.push(
    `<p style="margin:16px 0 0;color:#64748b;font-size:14px;">En cas d'empêchement, merci de nous prévenir à l'avance.</p>`,
  );

  return {
    subject: `Confirmation de rendez-vous — ${input.appName.trim() || "Workspace"}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;">
      <p style="margin:0 0 12px;">Bonjour ${guestName},</p>
      ${details.join("")}
    </div>`,
  };
}

export function buildAppointmentRejectionEmail(input: AppointmentRejectionEmailInput): {
  subject: string;
  html: string;
} {
  const guestName = escapeHtml(input.guestName.trim() || "Bonjour");
  const appName = escapeHtml(input.appName.trim() || "Workspace");
  const slot = escapeHtml(formatSlotRange(input.startsAt, input.startsAt));
  const reason = input.rejectionReason?.trim();

  const reasonBlock = reason
    ? `<p style="margin:12px 0 0;"><strong>Motif :</strong> ${escapeHtml(reason)}</p>`
    : "";

  return {
    subject: `Demande de rendez-vous — ${input.appName.trim() || "Workspace"}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;">
      <p style="margin:0 0 12px;">Bonjour ${guestName},</p>
      <p style="margin:0 0 8px;">Nous ne pouvons malheureusement pas confirmer votre demande de rendez-vous avec <strong>${appName}</strong> pour le créneau suivant :</p>
      <p style="margin:0 0 8px;"><strong>${slot}</strong></p>
      ${reasonBlock}
      <p style="margin:16px 0 0;color:#64748b;font-size:14px;">N'hésitez pas à nous recontacter pour proposer un autre créneau.</p>
    </div>`,
  };
}

export function isValidEmailAddress(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
