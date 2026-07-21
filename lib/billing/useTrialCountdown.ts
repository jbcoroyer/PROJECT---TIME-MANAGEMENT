"use client";

import { useEffect, useState } from "react";
import { getTrialCountdownParts, type TrialCountdownParts } from "./trialCountdown";

export function useTrialCountdown(trialEndsAt: string | null): TrialCountdownParts | null {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!trialEndsAt) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [trialEndsAt]);

  return getTrialCountdownParts(trialEndsAt, nowMs);
}
