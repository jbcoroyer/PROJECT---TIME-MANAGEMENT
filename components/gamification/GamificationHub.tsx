"use client";

import { Trophy } from "lucide-react";
import { levelFromXp } from "../../lib/gamification/catalog";
import { useGamificationOptional } from "../../lib/gamification/gamificationContext";
import { useTranslation } from "../../lib/i18n/useTranslation";
import GamificationPanel from "./GamificationPanel";

export default function GamificationHub() {
  const { t } = useTranslation({ preferBrowser: true });
  const gamification = useGamificationOptional();

  if (!gamification) return null;

  const level = levelFromXp(gamification.profile.xp);
  const inProgress = Object.values(gamification.profile.tutorials).some(
    (item) => item?.status === "in_progress",
  );

  return (
    <>
      <button
        type="button"
        onClick={gamification.openPanel}
        className="gamification-trigger"
        aria-label={t("gamification.panel.open")}
      >
        <Trophy className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
        <span className="hidden sm:inline">{t("gamification.panel.shortTitle")}</span>
        <span className="gamification-trigger__level">Niv. {level}</span>
        {inProgress ? <span className="gamification-trigger__dot" aria-hidden /> : null}
      </button>
      <GamificationPanel />
    </>
  );
}
