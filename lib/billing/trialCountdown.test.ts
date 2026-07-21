import { describe, expect, it } from "vitest";
import {
  formatTrialCountdownClock,
  getTrialCountdownParts,
  trialRemainingProgressPercent,
} from "./trialCountdown";

describe("trialCountdown", () => {
  const now = new Date("2026-07-13T10:00:00Z").getTime();

  it("calcule jours et heures restants", () => {
    const parts = getTrialCountdownParts("2026-07-20T14:30:45Z", now);
    expect(parts).toMatchObject({
      expired: false,
      days: 7,
      hours: 4,
      minutes: 30,
      seconds: 45,
    });
  });

  it("signale l'expiration", () => {
    const parts = getTrialCountdownParts("2026-07-10T10:00:00Z", now);
    expect(parts?.expired).toBe(true);
    expect(parts?.days).toBe(0);
  });

  it("formate l'horloge HH:MM:SS", () => {
    expect(
      formatTrialCountdownClock({ hours: 4, minutes: 5, seconds: 6 }),
    ).toBe("04:05:06");
  });

  it("calcule la progression restante", () => {
    const end = new Date(now + 7 * 86_400_000).toISOString();
    const progress = trialRemainingProgressPercent(end, 14, now);
    expect(progress).toBe(50);
  });
});
