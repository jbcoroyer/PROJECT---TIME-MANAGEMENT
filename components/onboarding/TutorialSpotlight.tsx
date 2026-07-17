"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { GripVertical } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";
import {
  clampTutorialCardPosition,
  getTutorialCardWidth,
  getTutorialViewportPadding,
  readStoredTutorialCardPosition,
  TUTORIAL_CARD_STORAGE_KEY,
  writeStoredTutorialCardPosition,
  type TutorialCardPoint,
} from "../../lib/onboarding/tutorialCardPosition";
import "./first-task-tutorial.css";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type CardPosition = "bottom" | "top" | "left" | "right" | "bottom-right" | "auto";

type TutorialSpotlightProps = {
  targetSelector: string;
  visible: boolean;
  padding?: number;
  children?: React.ReactNode;
  cardPosition?: CardPosition;
  storageKey?: string;
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

function isXpBarNode(node: React.ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const className = (node.props as { className?: string }).className;
  return typeof className === "string" && className.includes("first-task-tutorial__xp-bar");
}

function partitionCardChildren(children: React.ReactNode) {
  const items = Children.toArray(children);
  const xpIndex = items.findIndex(isXpBarNode);

  if (xpIndex === -1) {
    return {
      header: items.slice(0, 2),
      body: items.slice(2),
      footer: [] as React.ReactNode[],
    };
  }

  const beforeXp = items.slice(0, xpIndex);
  return {
    header: beforeXp.slice(0, 2),
    body: beforeXp.slice(2),
    footer: items.slice(xpIndex),
  };
}

function computeAnchoredPosition(
  rect: Rect,
  position: CardPosition,
  cardWidth: number,
  cardHeight: number,
): TutorialCardPoint {
  const pad = getTutorialViewportPadding();
  const gap = 14;
  const maxTop = window.innerHeight - cardHeight - pad.bottom;
  const maxLeft = window.innerWidth - cardWidth - pad.right;

  if (position === "bottom-right") {
    const preferredTop = Math.max(pad.top, window.innerHeight - cardHeight - pad.bottom - 12);
    return clampTutorialCardPosition(
      Math.min(preferredTop, maxTop),
      window.innerWidth - cardWidth - pad.right,
      cardWidth,
      cardHeight,
      pad,
    );
  }

  if (position === "top") {
    return clampTutorialCardPosition(
      Math.max(pad.top, rect.top - gap - cardHeight),
      Math.min(Math.max(pad.left, rect.left), maxLeft),
      cardWidth,
      cardHeight,
      pad,
    );
  }

  if (position === "left") {
    return clampTutorialCardPosition(
      Math.min(Math.max(pad.top, rect.top), maxTop),
      Math.max(pad.left, rect.left - gap - cardWidth),
      cardWidth,
      cardHeight,
      pad,
    );
  }

  if (position === "right") {
    return clampTutorialCardPosition(
      Math.min(Math.max(pad.top, rect.top), maxTop),
      Math.min(rect.left + rect.width + gap, maxLeft),
      cardWidth,
      cardHeight,
      pad,
    );
  }

  const belowTop = rect.top + rect.height + gap;
  const aboveTop = rect.top - gap - cardHeight;
  const fitsBelow = belowTop + cardHeight <= window.innerHeight - pad.bottom;
  const fitsAbove = aboveTop >= pad.top;

  if (position === "bottom" || (position === "auto" && fitsBelow)) {
    return clampTutorialCardPosition(
      Math.min(belowTop, maxTop),
      Math.min(Math.max(pad.left, rect.left), maxLeft),
      cardWidth,
      cardHeight,
      pad,
    );
  }

  if (position === "auto" && fitsAbove) {
    return clampTutorialCardPosition(
      aboveTop,
      Math.min(Math.max(pad.left, rect.left), maxLeft),
      cardWidth,
      cardHeight,
      pad,
    );
  }

  if (position === "auto") {
    const centeredTop = Math.max(pad.top, (window.innerHeight - cardHeight) / 2);
    return clampTutorialCardPosition(
      Math.min(centeredTop, maxTop),
      Math.max(pad.left, window.innerWidth - cardWidth - pad.right),
      cardWidth,
      cardHeight,
      pad,
    );
  }

  return clampTutorialCardPosition(belowTop, Math.max(pad.left, rect.left), cardWidth, cardHeight, pad);
}

export default function TutorialSpotlight({
  targetSelector,
  visible,
  padding = 8,
  children,
  cardPosition = "auto",
  storageKey = TUTORIAL_CARD_STORAGE_KEY,
}: TutorialSpotlightProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSize, setCardSize] = useState({ width: getTutorialCardWidth(), height: 280 });
  const [userPosition, setUserPosition] = useState<TutorialCardPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hasUserDraggedRef = useRef(false);

  const { header, body, footer } = useMemo(() => partitionCardChildren(children), [children]);

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

  useLayoutEffect(() => {
    if (!visible || !cardRef.current) return;

    const measureCard = () => {
      const node = cardRef.current;
      if (!node) return;
      const next = node.getBoundingClientRect();
      setCardSize((prev) => {
        const width = Math.round(next.width) || prev.width;
        const height = Math.round(next.height) || prev.height;
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    };

    measureCard();
    const observer = new ResizeObserver(measureCard);
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [visible, children]);

  useEffect(() => {
    if (!visible) return;
    hasUserDraggedRef.current = false;
    queueMicrotask(() => {
      setUserPosition(readStoredTutorialCardPosition(storageKey));
    });
  }, [visible, storageKey, targetSelector, cardPosition]);

  const anchoredPosition = useMemo(() => {
    if (!rect) return null;
    return computeAnchoredPosition(rect, cardPosition, cardSize.width, cardSize.height);
  }, [rect, cardPosition, cardSize.width, cardSize.height]);

  const resolvedPosition = useMemo(() => {
    if (userPosition) {
      return clampTutorialCardPosition(
        userPosition.top,
        userPosition.left,
        cardSize.width,
        cardSize.height,
      );
    }
    return anchoredPosition;
  }, [userPosition, cardSize.width, cardSize.height, anchoredPosition]);

  const persistPosition = useCallback(
    (position: TutorialCardPoint) => {
      setUserPosition(position);
      if (hasUserDraggedRef.current) {
        writeStoredTutorialCardPosition(position, storageKey);
      }
    },
    [storageKey],
  );

  const handleDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    event.preventDefault();
    const cardBox = cardRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - cardBox.left,
      y: event.clientY - cardBox.top,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleDragMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      hasUserDraggedRef.current = true;
      persistPosition(
        clampTutorialCardPosition(
          event.clientY - dragOffsetRef.current.y,
          event.clientX - dragOffsetRef.current.x,
          cardSize.width,
          cardSize.height,
        ),
      );
    },
    [cardSize.height, cardSize.width, isDragging, persistPosition],
  );

  const handleDragEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, [isDragging]);

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
        <div
          ref={cardRef}
          className={[
            "first-task-tutorial__card",
            isDragging ? "first-task-tutorial__card--dragging" : "",
          ].join(" ")}
          style={
            resolvedPosition
              ? { top: resolvedPosition.top, left: resolvedPosition.left }
              : { visibility: "hidden" }
          }
          role="dialog"
          aria-modal="false"
        >
          <div
            className="first-task-tutorial__card-header"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            aria-label={t("firstTaskTutorial.spotlight.dragHandle")}
          >
            <GripVertical className="first-task-tutorial__card-grip" aria-hidden />
            <div className="first-task-tutorial__card-header-content">{header}</div>
          </div>
          {body.length > 0 ? <div className="first-task-tutorial__card-body">{body}</div> : null}
          {footer.length > 0 ? <div className="first-task-tutorial__card-footer">{footer}</div> : null}
        </div>
      ) : null}
    </>,
    document.body,
  );
}
