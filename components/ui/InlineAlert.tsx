"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CircleAlert, CircleCheck, Info } from "lucide-react";

export type InlineAlertVariant = "danger" | "success" | "warning" | "info";

const ICONS: Record<InlineAlertVariant, typeof CircleAlert> = {
  danger: CircleAlert,
  success: CircleCheck,
  warning: AlertTriangle,
  info: Info,
};

type InlineAlertProps = {
  variant: InlineAlertVariant;
  children: ReactNode;
  className?: string;
};

export default function InlineAlert({ variant, children, className = "" }: InlineAlertProps) {
  const Icon = ICONS[variant];
  return (
    <div
      role="alert"
      className={[
        "ui-alert",
        `ui-alert-${variant}`,
        "ui-alert--with-icon",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="ui-alert__icon" aria-hidden>
        <Icon strokeWidth={2.25} />
      </span>
      <span className="ui-alert__text">{children}</span>
    </div>
  );
}

export function InlineAlertMessages(props: {
  error?: string | null;
  success?: string | null;
  warning?: string | null;
  className?: string;
}) {
  const { error, success, warning, className } = props;
  if (error) {
    return (
      <InlineAlert variant="danger" className={className}>
        {error}
      </InlineAlert>
    );
  }
  if (success) {
    return (
      <InlineAlert variant="success" className={className}>
        {success}
      </InlineAlert>
    );
  }
  if (warning) {
    return (
      <InlineAlert variant="warning" className={className}>
        {warning}
      </InlineAlert>
    );
  }
  return null;
}
