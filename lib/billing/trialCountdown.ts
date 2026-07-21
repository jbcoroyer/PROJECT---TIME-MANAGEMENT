export type TrialCountdownParts = {
  totalMs: number;
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function getTrialCountdownParts(
  trialEndsAt: string | null,
  nowMs = Date.now(),
): TrialCountdownParts | null {
  if (!trialEndsAt) return null;
  const endMs = new Date(trialEndsAt).getTime();
  if (Number.isNaN(endMs)) return null;

  const totalMs = endMs - nowMs;
  if (totalMs <= 0) {
    return { totalMs: 0, expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { totalMs, expired: false, days, hours, minutes, seconds };
}

export function formatTrialCountdownClock(parts: Pick<TrialCountdownParts, "hours" | "minutes" | "seconds">) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
}

export function trialRemainingProgressPercent(
  trialEndsAt: string | null,
  trialDurationDays: number,
  nowMs = Date.now(),
): number {
  const parts = getTrialCountdownParts(trialEndsAt, nowMs);
  if (!parts || parts.expired) return 0;
  const totalMs = trialDurationDays * 86_400_000;
  if (totalMs <= 0) return 0;
  return Math.min(100, Math.max(4, Math.round((parts.totalMs / totalMs) * 100)));
}
