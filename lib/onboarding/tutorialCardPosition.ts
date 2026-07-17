export const TUTORIAL_CARD_STORAGE_KEY = "tutorial-quest-card-position";

export type TutorialCardPoint = { top: number; left: number };

export type ViewportPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const BASE_VIEWPORT_PADDING = 16;

export function getTutorialViewportPadding(): ViewportPadding {
  return {
    top: BASE_VIEWPORT_PADDING,
    right: BASE_VIEWPORT_PADDING,
    bottom: BASE_VIEWPORT_PADDING,
    left: BASE_VIEWPORT_PADDING,
  };
}

export function getTutorialCardWidth(): number {
  if (typeof window === "undefined") return 352;
  return Math.min(352, window.innerWidth - 32);
}

export function clampTutorialCardPosition(
  top: number,
  left: number,
  cardWidth: number,
  cardHeight: number,
  padding: ViewportPadding = getTutorialViewportPadding(),
): TutorialCardPoint {
  if (typeof window === "undefined") return { top, left };

  const maxTop = window.innerHeight - cardHeight - padding.bottom;
  const maxLeft = window.innerWidth - cardWidth - padding.right;

  return {
    top: Math.min(Math.max(padding.top, top), Math.max(padding.top, maxTop)),
    left: Math.min(Math.max(padding.left, left), Math.max(padding.left, maxLeft)),
  };
}

export function readStoredTutorialCardPosition(key = TUTORIAL_CARD_STORAGE_KEY): TutorialCardPoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TutorialCardPoint>;
    if (typeof parsed.top !== "number" || typeof parsed.left !== "number") return null;
    return { top: parsed.top, left: parsed.left };
  } catch {
    return null;
  }
}

export function writeStoredTutorialCardPosition(
  position: TutorialCardPoint,
  key = TUTORIAL_CARD_STORAGE_KEY,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(position));
  } catch {
    // Ignore quota / private mode errors.
  }
}
