"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useIsClient } from "../../lib/useIsClient";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { ModalOverlay, ModalPanel } from "./ModalShell";

export type ConfirmOptions = {
  /** Titre principal de la boîte de dialogue. */
  title: string;
  /** Description / corps explicatif. Peut être un ReactNode (gras, liste, etc.). */
  description?: ReactNode;
  /** Libellé du bouton de confirmation. Défaut: "Confirmer" (rouge si destructive). */
  confirmLabel?: string;
  /** Libellé du bouton d'annulation. Défaut: "Annuler". */
  cancelLabel?: string;
  /**
   * Variante visuelle.
   * - "destructive" (par défaut) : icône poubelle, bouton rouge
   * - "warning" : icône alerte ambre, bouton ambre
   * - "default" : neutre, bouton accent
   */
  variant?: "destructive" | "warning" | "default";
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Hook pour ouvrir une boîte de dialogue de confirmation stylisée.
 *
 * Remplace `window.confirm()` natif par un composant uniforme et accessible.
 *
 * @example
 * const confirm = useConfirm();
 * const ok = await confirm({
 *   title: "Supprimer l'article ?",
 *   description: "Cette action est irréversible.",
 *   confirmLabel: "Supprimer",
 *   variant: "destructive",
 * });
 * if (!ok) return;
 */
export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmDialogProvider>.");
  }
  return ctx;
}

type PendingConfirm = {
  id: number;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const mounted = useIsClient();
  const nextIdRef = useRef(0);

  const confirm = useCallback<ConfirmContextValue>((options) => {
    return new Promise<boolean>((resolve) => {
      const id = ++nextIdRef.current;
      setPending({ id, options, resolve });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      setPending((current) => {
        if (current) current.resolve(value);
        return null;
      });
    },
    [],
  );

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
      } else if (event.key === "Enter") {
        event.preventDefault();
        close(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, pending]);

  const variant = pending?.options.variant ?? "destructive";
  const Icon = variant === "warning" ? AlertTriangle : variant === "default" ? AlertTriangle : Trash2;

  const iconWrapper =
    variant === "destructive"
      ? "bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger)]"
      : variant === "warning"
        ? "bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface))] text-[var(--warning)]"
        : "bg-[var(--accent-soft)] text-[var(--accent-strong)]";

  const confirmButton =
    variant === "destructive"
      ? "ui-btn ui-btn-danger"
      : variant === "warning"
        ? "bg-[var(--warning)] text-white hover:opacity-90"
        : "bg-[var(--foreground)] text-[var(--accent-contrast)] hover:opacity-90";

  const overlay =
    mounted &&
    pending &&
    createPortal(
      <ModalOverlay onBackdropClick={() => close(false)} labelledBy="confirm-dialog-title">
        <ModalPanel>
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconWrapper}`}>
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <button
              type="button"
              onClick={() => close(false)}
              className="ui-transition rounded-lg p-1.5 text-[color:var(--foreground)]/55 hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
              aria-label={t("confirmDialog.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 id="confirm-dialog-title" className="ui-display text-lg text-[var(--foreground)]">
            {pending.options.title}
          </h3>
          {pending.options.description ? (
            <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
              {pending.options.description}
            </p>
          ) : null}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => close(false)}
              className="ui-transition flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              {pending.options.cancelLabel ?? t("confirmDialog.cancel")}
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => close(true)}
              className={`ui-transition flex-1 rounded-xl py-2.5 text-sm font-semibold shadow-sm ${confirmButton}`}
            >
              {pending.options.confirmLabel ??
                (variant === "destructive" ? t("confirmDialog.delete") : t("confirmDialog.confirm"))}
            </button>
          </div>
        </ModalPanel>
      </ModalOverlay>,
      document.body,
    );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {overlay}
    </ConfirmContext.Provider>
  );
}
