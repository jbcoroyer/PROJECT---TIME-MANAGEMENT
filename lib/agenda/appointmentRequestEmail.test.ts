import { describe, expect, it } from "vitest";
import {
  buildAppointmentConfirmationEmail,
  buildAppointmentRejectionEmail,
  isValidEmailAddress,
} from "./appointmentRequestEmail";

describe("isValidEmailAddress", () => {
  it("accepts valid emails", () => {
    expect(isValidEmailAddress("guest@example.com")).toBe(true);
    expect(isValidEmailAddress("  name@domain.co  ")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmailAddress("")).toBe(false);
    expect(isValidEmailAddress("not-an-email")).toBe(false);
    expect(isValidEmailAddress("a@b")).toBe(false);
  });
});

describe("buildAppointmentConfirmationEmail", () => {
  it("includes location, video link and custom message", () => {
    const { subject, html } = buildAppointmentConfirmationEmail({
      guestName: "Alice",
      appName: "Studio",
      startsAt: "2026-07-20T10:00:00.000Z",
      endsAt: "2026-07-20T10:30:00.000Z",
      location: "12 rue de Paris",
      meetingUrl: "https://meet.example.com/abc",
      customMessage: "Merci d'apporter votre dossier.",
    });

    expect(subject).toContain("Studio");
    expect(html).toContain("Alice");
    expect(html).toContain("12 rue de Paris");
    expect(html).toContain("https://meet.example.com/abc");
    expect(html).toContain("Merci d'apporter votre dossier.");
  });
});

describe("buildAppointmentRejectionEmail", () => {
  it("includes optional rejection reason", () => {
    const { html } = buildAppointmentRejectionEmail({
      guestName: "Bob",
      appName: "Studio",
      startsAt: "2026-07-20T10:00:00.000Z",
      rejectionReason: "Créneau indisponible",
    });

    expect(html).toContain("Bob");
    expect(html).toContain("Créneau indisponible");
  });
});
