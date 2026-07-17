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
import { GripVertical } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";
import {
  clampTutorialCardPosition,
  getTutorialViewportPadding,
  readStoredTutorialCardPosition,
  TUTORIAL_CARD_STORAGE_KEY,
  writeStoredTutorialCardPosition,
  type TutorialCardPoint,
} from "../../lib/onboarding/tutorialCardPosition";

type TutorialDraggableCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  storageKey?: string;
  defaultPlacement?: "bottom-right";
  role?: string;
  "aria-modal"?: boolean | "true" | "false";
};

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

export default function TutorialDraggableCard({
  children,
  className = "",
  style,
  storageKey = TUTORIAL_CARD_STORAGE_KEY,
  defaultPlacement,
  role = "dialog",
  "aria-modal": ariaModal = "false",
}: TutorialDraggableCardProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const cardRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hasUserDraggedRef = useRef(false);

  const [cardSize, setCardSize] = useState({ width: 352, height: 280 });
  const [userPosition, setUserPosition] = useState<TutorialCardPoint | null>(null);
  const [defaultPosition, setDefaultPosition] = useState<TutorialCardPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { header, body, footer } = useMemo(() => partitionCardChildren(children), [children]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;

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
  }, [children]);

  useEffect(() => {
    hasUserDraggedRef.current = false;
    setUserPosition(readStoredTutorialCardPosition(storageKey));
  }, [storageKey]);

  useLayoutEffect(() => {
    if (userPosition || defaultPlacement !== "bottom-right") return;
    const pad = getTutorialViewportPadding();
    setDefaultPosition(
      clampTutorialCardPosition(
        window.innerHeight - cardSize.height - pad.bottom,
        window.innerWidth - cardSize.width - pad.right,
        cardSize.width,
        cardSize.height,
        pad,
      ),
    );
  }, [userPosition, defaultPlacement, cardSize.width, cardSize.height]);

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

  const resolvedPosition = userPosition ?? defaultPosition;
  const clampedPosition = resolvedPosition
    ? clampTutorialCardPosition(
        resolvedPosition.top,
        resolvedPosition.left,
        cardSize.width,
        cardSize.height,
      )
    : null;

  const mergedStyle: React.CSSProperties = clampedPosition
    ? {
        ...style,
        position: "fixed",
        top: clampedPosition.top,
        left: clampedPosition.left,
        right: "auto",
        bottom: "auto",
      }
    : (style ?? {});

  return (
    <div
      ref={cardRef}
      className={[
        "first-task-tutorial__card",
        className,
        isDragging ? "first-task-tutorial__card--dragging" : "",
      ].join(" ")}
      style={mergedStyle}
      role={role}
      aria-modal={ariaModal}
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
  );
}
