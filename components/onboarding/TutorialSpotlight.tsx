"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./first-task-tutorial.css";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TutorialSpotlightProps = {
  targetSelector: string;
  visible: boolean;
  padding?: number;
  children?: React.ReactNode;
  cardPosition?: "bottom" | "top" | "left" | "right" | "auto";
};

function measureTarget(selector: string, padding: number): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  return {
    top: box.top - padding,
    left: box.left - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
  };
}

function cardStyle(rect: Rect, position: TutorialSpotlightProps["cardPosition"]): React.CSSProperties {
  const gap = 14;
  const cardWidth = Math.min(352, window.innerWidth - 32);
  const base: React.CSSProperties = { width: cardWidth };

  if (position === "bottom" || position === "auto") {
    const top = rect.top + rect.height + gap;
    if (top + 180 < window.innerHeight || position === "bottom") {
      return {
        ...base,
        top: Math.min(top, window.innerHeight - 200),
        left: Math.min(Math.max(16, rect.left), window.innerWidth - cardWidth - 16),
      };
    }
  }

  if (position === "top" || position === "auto") {
    return {
      ...base,
      top: Math.max(16, rect.top - gap - 180),
      left: Math.min(Math.max(16, rect.left), window.innerWidth - cardWidth - 16),
    };
  }

  return {
    ...base,
    top: Math.min(rect.top, window.innerHeight - 200),
    left: Math.min(rect.left + rect.width + gap, window.innerWidth - cardWidth - 16),
  };
}

export default function TutorialSpotlight({
  targetSelector,
  visible,
  padding = 8,
  children,
  cardPosition = "auto",
}: TutorialSpotlightProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!visible) return;

    const update = () => setRect(measureTarget(targetSelector, padding));
    update();

    const observer = new ResizeObserver(update);
    const el = document.querySelector(targetSelector);
    if (el) observer.observe(el);

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    const interval = window.setInterval(update, 400);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.clearInterval(interval);
    };
  }, [visible, targetSelector, padding]);

  if (typeof document === "undefined" || !visible || !rect) return null;

  return createPortal(
    <>
      <div
        className="first-task-tutorial__spotlight-ring"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
        aria-hidden
      />
      {children ? (
        <div className="first-task-tutorial__card" style={cardStyle(rect, cardPosition)}>
          {children}
        </div>
      ) : null}
    </>,
    document.body,
  );
}
