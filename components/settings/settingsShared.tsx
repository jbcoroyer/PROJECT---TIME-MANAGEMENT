"use client";

import { Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { ModalOverlay, ModalPanel } from "../ui/ModalShell";

export function ConfirmDeleteModal(props: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ModalOverlay onBackdropClick={props.onCancel}>
      <ModalPanel>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]">
          <Trash2 className="h-6 w-6 text-[var(--danger)]" />
        </div>
        <h3 className="ui-display text-lg text-[var(--foreground)]">{t("common.confirmDeleteTitle")}</h3>
        <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
          {t("common.confirmDeleteBody", { label: props.label })}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={props.onCancel}
            className="ui-transition flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)]"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className="ui-transition ui-btn ui-btn-danger flex-1 rounded-xl py-2.5 text-sm font-semibold shadow-sm"
          >
            {t("common.delete")}
          </button>
        </div>
      </ModalPanel>
    </ModalOverlay>
  );
}

export function SettingsSection(props: {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const Icon = props.icon;
  return (
    <div id={props.id} className={props.id ? "scroll-mt-24" : undefined}>
      <div className="ui-surface overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)]">
            <Icon className="h-5 w-5 text-[color:var(--foreground)]/50" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-[var(--foreground)]">{props.title}</h2>
            <p className="text-xs text-[color:var(--foreground)]/60">{props.subtitle}</p>
          </div>
          {props.badge ? (
            <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--foreground)]/75">
              {props.badge}
            </span>
          ) : null}
        </div>
        <div className="p-5">{props.children}</div>
      </div>
    </div>
  );
}

export function EntityRow(props: {
  isActive: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
  prefix?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={[
        "flex items-center gap-2 rounded-xl border p-2.5",
        props.isActive
          ? "border-[var(--line)] bg-[var(--surface)]"
          : "border-dashed border-[var(--line)] bg-[var(--surface-soft)] opacity-60",
      ].join(" ")}
    >
      {props.prefix}
      <input
        value={props.editValue}
        onChange={(e) => props.onEditChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && props.onSave()}
        className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--line)] focus:bg-[var(--surface-soft)]"
      />
      {props.extra}
      <button
        type="button"
        onClick={props.onSave}
        title={t("common.save")}
        className="ui-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--success)] hover:bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))]"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={props.onToggle}
        title={props.isActive ? t("common.deactivate") : t("common.activate")}
        className="ui-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/60 hover:bg-[var(--surface)]"
      >
        {props.isActive ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={props.onDelete}
        title={t("common.delete")}
        className="ui-transition ui-btn ui-btn-outline-danger flex h-8 w-8 shrink-0 items-center justify-center rounded-lg !p-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
