"use client";

import type { ReactNode } from "react";
import type { AppModuleId } from "../../lib/modules";
import "./module-illustrations.css";

type ModuleIllustrationProps = {
  moduleId: AppModuleId;
  active?: boolean;
  size?: "sm" | "lg" | "hero";
};

export function ModuleIllustrationStage({
  moduleId,
  active = false,
  size = "sm",
}: ModuleIllustrationProps) {
  return (
    <div
      className={[
        "module-illus-stage",
        size === "hero"
          ? "module-illus-stage--hero"
          : size === "lg"
            ? "module-illus-stage--lg"
            : "module-illus-stage--sm",
        active ? "module-illus-stage--active" : "",
      ].join(" ")}
    >
      <div className="module-illus-stage__particles" aria-hidden>
        <span className="module-illus-particle module-illus-particle--1" />
        <span className="module-illus-particle module-illus-particle--2" />
        <span className="module-illus-particle module-illus-particle--3" />
      </div>
      <div className="module-illus-stage__bg" aria-hidden />
      <div className="module-illus-stage__glow" aria-hidden />
      <ModuleIllustration moduleId={moduleId} active={active} size={size} />
    </div>
  );
}

export default function ModuleIllustration({
  moduleId,
  active = false,
  size = "sm",
}: ModuleIllustrationProps) {
  return (
    <div
      className={[
        "module-illus",
        `module-illus--${moduleId}`,
        size === "hero" ? "module-illus--hero" : size === "lg" ? "module-illus--lg" : "",
        active ? "module-illus--active" : "",
      ].join(" ")}
      aria-hidden
    >
      {ILLUSTRATIONS[moduleId]}
    </div>
  );
}

const accent = "var(--illus-accent)";
const muted = "var(--illus-muted)";
const surface = "var(--illus-surface)";

const ILLUSTRATIONS: Record<AppModuleId, ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <rect x="6" y="10" width="10" height="28" rx="2" stroke={muted} strokeWidth="1.5" />
      <rect x="19" y="10" width="10" height="28" rx="2" stroke={muted} strokeWidth="1.5" />
      <rect x="32" y="10" width="10" height="28" rx="2" stroke={muted} strokeWidth="1.5" />
      <g className="mi-dashboard-c1">
        <rect x="7.5" y="16" width="7" height="5" rx="1" fill={accent} opacity="0.95" />
        <rect x="7.5" y="23" width="7" height="4" rx="1" fill={surface} stroke={accent} strokeWidth="1" />
      </g>
      <g className="mi-dashboard-c2">
        <rect x="20.5" y="20" width="7" height="4" rx="1" fill={surface} stroke={muted} strokeWidth="1" />
      </g>
      <g className="mi-dashboard-c3">
        <rect x="33.5" y="14" width="7" height="5" rx="1" fill={surface} stroke={muted} strokeWidth="1" />
      </g>
    </svg>
  ),

  asks: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <g className="mi-asks-inbox">
        <path
          d="M10 30h28l-4-8H14l-4 8z"
          stroke={muted}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M10 30v4a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2v-4" stroke={muted} strokeWidth="1.5" />
      </g>
      <g transform="translate(24, 17.5)">
        <g className="mi-asks-send">
          <rect x="-8" y="-5.5" width="16" height="11" rx="1.5" fill={surface} stroke={accent} strokeWidth="1.5" />
          <path d="M-8 -3.5l8 5.5L8 -3.5" stroke={accent} strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  ),

  workspace: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <rect x="12" y="8" width="24" height="32" rx="3" stroke={muted} strokeWidth="1.5" />
      <line x1="16" y1="16" x2="32" y2="16" stroke={muted} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="24" x2="28" y2="24" stroke={muted} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="32" x2="26" y2="32" stroke={muted} strokeWidth="1.2" strokeLinecap="round" />
      <g transform="translate(14, 16)">
        <g className="mi-workspace-check-1">
          <circle cx="0" cy="0" r="2.5" fill={accent} />
          <path d="M-1 0l0.8 0.8L1.2 -1" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>
      <g transform="translate(14, 24)">
        <g className="mi-workspace-check-2">
          <circle cx="0" cy="0" r="2.5" fill={accent} />
          <path d="M-1 0l0.8 0.8L1.2 -1" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>
      <g transform="translate(14, 32)">
        <g className="mi-workspace-check-3">
          <circle cx="0" cy="0" r="2.5" fill={accent} />
          <path d="M-1 0l0.8 0.8L1.2 -1" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  ),

  planning: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <line x1="8" y1="34" x2="40" y2="34" stroke={muted} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="34" x2="8" y2="12" stroke={muted} strokeWidth="1.5" strokeLinecap="round" />
      <g transform="translate(12, 29)">
        <rect x="0" y="-3" width="22" height="6" rx="1" className="mi-planning-bar" fill={accent} opacity="0.85" />
      </g>
      <rect x="12" y="18" width="14" height="5" rx="1" fill={surface} stroke={muted} strokeWidth="1" />
      <g transform="translate(20, 23)">
        <g className="mi-planning-cursor">
          <line x1="0" y1="-13" x2="0" y2="13" stroke={accent} strokeWidth="1.5" strokeDasharray="2 2" />
          <polygon points="0,-13 -3,-9 3,-9" fill={accent} />
        </g>
      </g>
    </svg>
  ),

  events: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <path d="M8 38h32" stroke={muted} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 38V22l10-8 10 8v16" stroke={muted} strokeWidth="1.5" strokeLinejoin="round" />
      <g transform="translate(24, 38)">
        <g className="mi-events-beam">
          <path d="M-16 0 L0 -24 L16 0" fill={accent} opacity="0.2" />
        </g>
      </g>
      <g transform="translate(30, 20)">
        <g className="mi-events-flag">
          <line x1="0" y1="-6" x2="0" y2="6" stroke={accent} strokeWidth="1.5" />
          <path d="M0 -6h8l-2 4 2 4h-8" fill={accent} opacity="0.9" />
        </g>
      </g>
      <circle cx="24" cy="30" r="2" fill={accent} />
      <g transform="translate(38, 12)">
        <g className="mi-events-sparkle">
          <circle cx="0" cy="0" r="1.5" fill={accent} />
        </g>
      </g>
    </svg>
  ),

  social: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <path
        d="M18 32c0-6 4-10 6-14 2 4 6 8 6 14"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="32" rx="4" ry="2" fill={accent} opacity="0.5" />
      <rect x="14" y="32" width="20" height="3" rx="1" fill={muted} opacity="0.5" />
      <g transform="translate(36, 18)">
        <circle cx="0" cy="0" r="3" className="mi-social-wave-1" stroke={accent} strokeWidth="1.2" fill="none" />
        <circle cx="0" cy="0" r="6" className="mi-social-wave-2" stroke={accent} strokeWidth="1" fill="none" />
        <circle cx="0" cy="0" r="9" className="mi-social-wave-3" stroke={muted} strokeWidth="0.8" fill="none" />
      </g>
    </svg>
  ),

  dam: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <path
        d="M10 18h20a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V20a2 2 0 0 1 2-2z"
        stroke={muted}
        strokeWidth="1.5"
      />
      <path d="M10 22h24" stroke={muted} strokeWidth="1.2" />
      <g transform="translate(14, 30)">
        <g className="mi-dam-file-1">
          <rect x="0" y="-4" width="12" height="9" rx="1" fill={surface} stroke={accent} strokeWidth="1.2" />
          <circle cx="3" cy="0" r="1.5" fill={accent} opacity="0.6" />
        </g>
      </g>
      <g transform="translate(18, 28.5)">
        <g className="mi-dam-file-2">
          <rect x="0" y="-4.5" width="12" height="9" rx="1" fill={surface} stroke={muted} strokeWidth="1" opacity="0.85" />
        </g>
      </g>
      <g transform="translate(22, 27)">
        <g className="mi-dam-file-3">
          <rect x="0" y="-4.5" width="12" height="9" rx="1" fill={surface} stroke={muted} strokeWidth="1" opacity="0.6" />
        </g>
      </g>
    </svg>
  ),

  stock: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <path d="M8 36h32" stroke={muted} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="10" y="28" width="12" height="8" rx="1" stroke={muted} strokeWidth="1.2" fill={surface} />
      <rect x="26" y="24" width="12" height="12" rx="1" stroke={muted} strokeWidth="1.2" fill={surface} />
      <g transform="translate(24, 19)">
        <g className="mi-stock-box">
          <rect x="-7" y="-5" width="14" height="10" rx="1.5" fill={accent} opacity="0.9" />
          <line x1="-7" y1="0" x2="7" y2="0" stroke="white" strokeWidth="1" opacity="0.5" />
        </g>
      </g>
      <g transform="translate(36, 20)">
        <g className="mi-stock-badge">
          <circle cx="0" cy="0" r="5" fill={accent} />
          <text x="0" y="2" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">
            +1
          </text>
        </g>
      </g>
    </svg>
  ),

  ideas: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <g transform="translate(24, 22)">
        <g className="mi-ideas-glow">
          <circle cx="0" cy="0" r="10" fill={accent} />
        </g>
      </g>
      <path
        d="M24 10c-5 0-8 4-8 8 0 3 1.5 5 3 6.5V28h10v-3.5c1.5-1.5 3-3.5 3-6.5 0-4-3-8-8-8z"
        stroke={accent}
        strokeWidth="1.5"
        fill={surface}
      />
      <path d="M20 30h8v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2z" fill={accent} opacity="0.5" />
      <g transform="translate(34, 12)">
        <g className="mi-ideas-spark-1">
          <path d="M0 0l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill={accent} />
        </g>
      </g>
      <g transform="translate(12, 18)">
        <g className="mi-ideas-spark-2">
          <path d="M0 0l0.8 1.5 1.5 0.8-1.5 0.8L0 3l-0.8-1.5-1.5-0.8 1.5-0.8z" fill={muted} />
        </g>
      </g>
      <g transform="translate(10, 10)">
        <g className="mi-ideas-spark-3">
          <path d="M0 0l0.6 1.2 1.2 0.6-1.2 0.6L0 4l-0.6-1.2-1.2-0.6 1.2-0.6z" fill={accent} opacity="0.7" />
        </g>
      </g>
    </svg>
  ),

  okr: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <circle cx="28" cy="24" r="12" stroke={muted} strokeWidth="1.5" />
      <g transform="translate(28, 24)">
        <circle cx="0" cy="0" r="7" className="mi-okr-ring" stroke={accent} strokeWidth="1.5" fill="none" />
      </g>
      <circle cx="28" cy="24" r="2.5" fill={accent} />
      <g transform="translate(13, 24)">
        <g className="mi-okr-arrow">
          <line x1="-7" y1="0" x2="7" y2="0" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <polygon points="7,0 3,-3 3,3" fill={accent} />
        </g>
      </g>
    </svg>
  ),

  surveys: (
    <svg viewBox="0 0 48 48" fill="none" role="presentation">
      <rect x="12" y="8" width="24" height="32" rx="3" stroke={muted} strokeWidth="1.5" />
      <rect x="16" y="14" width="16" height="3" rx="1" fill={muted} opacity="0.35" />
      <rect x="16" y="20" width="16" height="3" rx="1" fill={muted} opacity="0.25" />
      <rect x="16" y="26" width="16" height="3" rx="1" fill={muted} opacity="0.25" />
      <g transform="translate(16, 15.5)">
        <rect x="0" y="-1.5" width="10" height="3" rx="1" className="mi-survey-bar-1" fill={accent} />
      </g>
      <g transform="translate(16, 21.5)">
        <rect x="0" y="-1.5" width="13" height="3" rx="1" className="mi-survey-bar-2" fill={accent} opacity="0.8" />
      </g>
      <g transform="translate(16, 27.5)">
        <rect x="0" y="-1.5" width="7" height="3" rx="1" className="mi-survey-bar-3" fill={accent} opacity="0.6" />
      </g>
      <g transform="translate(16, 34)">
        <g className="mi-survey-pen">
          <line x1="0" y1="0" x2="12" y2="0" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
        </g>
      </g>
    </svg>
  ),
};
