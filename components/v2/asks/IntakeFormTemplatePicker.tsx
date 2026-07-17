"use client";

import {
  Briefcase,
  FileText,
  LifeBuoy,
  MessageCircle,
  Palette,
  type LucideIcon,
} from "lucide-react";
import {
  INTAKE_FORM_TEMPLATE_META,
  type IntakeFormTemplateId,
} from "../../../lib/intake/intakeFormTemplates";
import { useTranslation } from "../../../lib/i18n/useTranslation";

const TEMPLATE_ICONS: Record<IntakeFormTemplateId, LucideIcon> = {
  blank: FileText,
  project: Briefcase,
  general_inquiry: MessageCircle,
  support: LifeBuoy,
  creative_brief: Palette,
};

type IntakeFormTemplatePickerProps = {
  value: IntakeFormTemplateId;
  onChange: (templateId: IntakeFormTemplateId) => void;
  disabled?: boolean;
};

export default function IntakeFormTemplatePicker({
  value,
  onChange,
  disabled = false,
}: IntakeFormTemplatePickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {t("asks.templates.picker.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {t("asks.templates.picker.description")}
        </p>
      </div>

      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label={t("asks.templates.picker.ariaLabel")}
      >
        {INTAKE_FORM_TEMPLATE_META.map((meta) => {
          const Icon = TEMPLATE_ICONS[meta.id];
          const selected = value === meta.id;
          const name = t(`asks.templates.${meta.id}.name`);
          const description = t(`asks.templates.${meta.id}.description`);

          return (
            <button
              key={meta.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(meta.id)}
              className={[
                "ui-transition ui-surface rounded-xl p-4 text-left",
                selected
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/25"
                  : "hover:border-[var(--accent)]/50",
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    selected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--accent)]/10 text-[var(--accent)]",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--foreground)]">{name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {description}
                  </p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                    {t("asks.templates.picker.meta", {
                      count: meta.fieldCount,
                      minutes: meta.estimatedMinutes,
                    })}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
