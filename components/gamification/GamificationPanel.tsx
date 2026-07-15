"use client";

import { Compass, Layers, Rocket, Sparkles, Star, Users, X } from "lucide-react";
import Link from "next/link";
import { BADGES, TUTORIALS, levelFromXp, xpProgressInLevel } from "../../lib/gamification/catalog";
import { useGamification } from "../../lib/gamification/gamificationContext";
import type { TutorialId, TutorialStatus } from "../../lib/gamification/types";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./gamification.css";

const BADGE_ICONS = {
  sparkles: Sparkles,
  rocket: Rocket,
  users: Users,
  compass: Compass,
  layers: Layers,
  star: Star,
} as const;

function statusLabel(status: TutorialStatus | undefined, t: (k: string) => string): string {
  if (status === "completed") return t("gamification.status.completed");
  if (status === "in_progress") return t("gamification.status.inProgress");
  if (status === "skipped") return t("gamification.status.skipped");
  return t("gamification.status.pending");
}

export default function GamificationPanel() {
  const { t } = useTranslation({ preferBrowser: true });
  const {
    profile,
    panelOpen,
    closePanel,
    resumeTutorial,
    skipTutorialQuest,
  } = useGamification();

  if (!panelOpen || !profile) return null;

  const level = levelFromXp(profile.xp);
  const xpBar = xpProgressInLevel(profile.xp);
  const earned = new Set(profile.badges);

  return (
    <>
      <button
        type="button"
        aria-label={t("gamification.panel.close")}
        className="gamification-backdrop"
        onClick={closePanel}
      />
      <aside className="gamification-panel" role="dialog" aria-modal="true" aria-labelledby="gamification-title">
        <div className="gamification-panel__header">
          <div>
            <p className="gamification-panel__kicker">{t("gamification.panel.kicker")}</p>
            <h2 id="gamification-title" className="gamification-panel__title">
              {t("gamification.panel.title")}
            </h2>
          </div>
          <button type="button" onClick={closePanel} className="gamification-panel__close" aria-label={t("gamification.panel.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="gamification-panel__level-card">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                {t("gamification.panel.level")}
              </p>
              <p className="ui-display text-4xl leading-none text-[var(--ink)]">{level}</p>
            </div>
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--ink-muted)]">
              {profile.xp} XP
            </p>
          </div>
          <div className="gamification-xp-bar mt-4">
            <div className="gamification-xp-bar__fill" style={{ width: `${Math.round(xpBar.ratio * 100)}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
            {t("gamification.panel.xpToNext", {
              current: String(xpBar.current),
              max: String(xpBar.max),
            })}
          </p>
        </div>

        <section className="gamification-panel__section">
          <h3 className="gamification-panel__section-title">{t("gamification.panel.quests")}</h3>
          <ul className="space-y-3">
            {TUTORIALS.map((quest) => {
              const progress = profile.tutorials[quest.id];
              const status = progress?.status;
              const isDone = status === "completed";
              const isActive = status === "in_progress";
              const href = quest.tourParam ? `${quest.href}?${quest.tourParam}` : quest.href;

              return (
                <li key={quest.id} className="gamification-quest-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--ink)]">{t(quest.titleKey)}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {t(quest.descriptionKey)}
                      </p>
                      <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[var(--accent)]">
                        +{quest.xpReward} XP · {statusLabel(status, t)}
                      </p>
                    </div>
                    <span className="gamification-quest-card__time">{quest.estimatedMinutes} min</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isDone ? (
                      <span className="gamification-chip gamification-chip--done">{t("gamification.actions.done")}</span>
                    ) : isActive && quest.id === "first_task" ? (
                      <button
                        type="button"
                        className="gamification-chip gamification-chip--primary"
                        onClick={() => resumeTutorial("first_task")}
                      >
                        {t("gamification.actions.resume")}
                      </button>
                    ) : (
                      <Link
                        href={href}
                        className="gamification-chip gamification-chip--primary"
                        onClick={() => closePanel()}
                      >
                        {isActive ? t("gamification.actions.continue") : t("gamification.actions.start")}
                      </Link>
                    )}
                    {!isDone && status !== "skipped" ? (
                      <button
                        type="button"
                        className="gamification-chip"
                        onClick={() => void skipTutorialQuest(quest.id as TutorialId)}
                      >
                        {t("gamification.actions.skip")}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="gamification-panel__section">
          <h3 className="gamification-panel__section-title">
            {t("gamification.panel.badges")} ({earned.size}/{BADGES.length})
          </h3>
          <div className="gamification-badges-grid">
            {BADGES.map((badge) => {
              const unlocked = earned.has(badge.id);
              const Icon = BADGE_ICONS[badge.icon];
              return (
                <div
                  key={badge.id}
                  className={[
                    "gamification-badge",
                    unlocked ? "gamification-badge--unlocked" : "gamification-badge--locked",
                  ].join(" ")}
                >
                  <div className="gamification-badge__icon">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="gamification-badge__title">{t(badge.titleKey)}</p>
                  <p className="gamification-badge__desc">{t(badge.descriptionKey)}</p>
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </>
  );
}
