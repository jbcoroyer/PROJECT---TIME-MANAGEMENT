"use client";

import type { ReactNode } from "react";

type ModalOverlayProps = {
  children: ReactNode;
  onBackdropClick?: () => void;
  /** ID pour aria-labelledby */
  labelledBy?: string;
};

export function ModalOverlay({ children, onBackdropClick, labelledBy }: ModalOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="ui-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onBackdropClick?.();
      }}
    >
      {children}
    </div>
  );
}

type ModalPanelProps = {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function ModalPanel({ children, size = "sm", className = "" }: ModalPanelProps) {
  const sizeClass =
    size === "lg" ? "ui-modal-panel--lg" : size === "md" ? "ui-modal-panel--md" : "";
  return (
    <div className={["ui-modal-panel", sizeClass, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
