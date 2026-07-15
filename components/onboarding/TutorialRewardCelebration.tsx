"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Star, Trophy } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./first-task-tutorial.css";

const PARTICLE_COLORS = ["#fbbf24", "#f472b6", "#60a5fa", "#34d399", "#a78bfa", "#fb923c"];

type TutorialRewardCelebrationProps = {
  open: boolean;
  onComplete: () => void;
  /** Préfixe i18n (ex. firstTaskTutorial.reward ou boardExploration.reward). */
  messagePrefix?: string;
};

export default function TutorialRewardCelebration({
  open,
  onComplete,
  messagePrefix = "firstTaskTutorial.reward",
}: TutorialRewardCelebrationProps) {
  const { t } = useTranslation({ preferBrowser: true });

  const [particles] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      x: (Math.random() - 0.5) * 280,
      y: (Math.random() - 0.5) * 220 - 40,
      delay: Math.random() * 0.35,
      size: 4 + Math.random() * 6,
    })),
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="first-task-tutorial__reward" role="dialog" aria-modal="true">
      <motion.div
        className="first-task-tutorial__reward-card"
        initial={{ opacity: 0, scale: 0.82, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="first-task-tutorial__particle"
            style={{
              left: "50%",
              top: "38%",
              background: p.color,
              width: p.size,
              height: p.size,
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], x: p.x, y: p.y, scale: [0, 1.2, 0.4] }}
            transition={{ duration: 1.4, delay: 0.15 + p.delay, ease: "easeOut" }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.1, stiffness: 300, damping: 16 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-lg"
        >
          <Trophy className="h-8 w-8" aria-hidden />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-amber-600"
        >
          {t(`${messagePrefix}.badge`)}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-1 text-2xl font-bold text-[var(--foreground)]"
        >
          {t(`${messagePrefix}.title`)}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-sm text-[color:var(--foreground)]/65"
        >
          {t(`${messagePrefix}.body`)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-50/80 px-3 py-1.5 text-sm font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
          {t(`${messagePrefix}.xp`)}
          <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
        </motion.div>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          onClick={onComplete}
          className="ui-btn ui-btn-primary mt-5 w-full px-4 py-2.5 text-sm font-semibold"
        >
          {t(`${messagePrefix}.cta`)}
        </motion.button>
      </motion.div>
    </div>,
    document.body,
  );
}
