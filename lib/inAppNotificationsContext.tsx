"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import TaskRealtimeNotifications from "../components/TaskRealtimeNotifications";
import type { InAppNotificationHistoryEntry, InAppNotificationInput } from "./inAppNotificationTypes";
import { useIsClient } from "./useIsClient";

export type { InAppNotificationInput, InAppNotificationHistoryEntry } from "./inAppNotificationTypes";

type ToastItem = InAppNotificationInput & { id: string };

type InAppNotificationsContextValue = {
  pushNotification: (input: InAppNotificationInput) => void;
  dismissToast: (id: string) => void;
  history: InAppNotificationHistoryEntry[];
  markHistoryRead: () => void;
  clearHistory: () => void;
  unreadCount: number;
};

const InAppNotificationsContext = createContext<InAppNotificationsContextValue | null>(null);

export function useInAppNotifications(): InAppNotificationsContextValue {
  const ctx = useContext(InAppNotificationsContext);
  if (!ctx) {
    throw new Error("useInAppNotifications doit être utilisé sous InAppNotificationProvider.");
  }
  return ctx;
}

const AUTO_DISMISS_MS = 12_000;
const MAX_TOASTS = 6;
const MAX_HISTORY = 40;

function NotificationStack(props: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const { items, onDismiss } = props;
  const mounted = useIsClient();

  if (!mounted || items.length === 0) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed flex flex-col gap-3 p-0"
      style={{
        top: "max(5.25rem, env(safe-area-inset-top, 0px))",
        right: "max(1rem, env(safe-area-inset-right, 0px))",
        width: "min(calc(100vw - 2rem), 400px)",
        zIndex: "var(--z-toast)",
      }}
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto ui-toast-card ui-toast-card--info">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="ui-toast-card__icon">
              <Bell className="h-4 w-4" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <p className="ui-toast-card__title">{item.title}</p>
              {item.body ? <p className="ui-toast-card__body">{item.body}</p> : null}
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={() => onDismiss(item.id)}
                  className="ui-transition mt-2 inline-flex text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]"
                >
                  Ouvrir
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="ui-transition absolute right-3 top-3 rounded-lg border border-transparent p-1.5 text-[color:var(--foreground)]/45 hover:border-[var(--line)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
              aria-label="Fermer la notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function InAppNotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [history, setHistory] = useState<InAppNotificationHistoryEntry[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const unreadCount = useMemo(() => history.filter((h) => !h.read).length, [history]);

  const clearTimer = useCallback((id: string) => {
    const timers = timersRef.current;
    const t = timers.get(id);
    if (t) {
      clearTimeout(t);
      timers.delete(id);
    }
  }, []);

  const dismissToast = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((x) => x.id !== id));
    },
    [clearTimer],
  );

  const markHistoryRead = useCallback(() => {
    setHistory((prev) => prev.map((h) => ({ ...h, read: true })));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const pushNotification = useCallback((input: InAppNotificationInput) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `n-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: ToastItem = { ...input, id };
    const entry: InAppNotificationHistoryEntry = {
      ...input,
      id,
      at: Date.now(),
      read: false,
    };

    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
    setToasts((prev) => [toast, ...prev].slice(0, MAX_TOASTS));

    const t = setTimeout(() => {
      timersRef.current.delete(id);
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, AUTO_DISMISS_MS);
    timersRef.current.set(id, t);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      pushNotification,
      dismissToast,
      history,
      markHistoryRead,
      clearHistory,
      unreadCount,
    }),
    [pushNotification, dismissToast, history, markHistoryRead, clearHistory, unreadCount],
  );

  return (
    <InAppNotificationsContext.Provider value={value}>
      {children}
      <TaskRealtimeNotifications pushNotification={pushNotification} />
      <NotificationStack items={toasts} onDismiss={dismissToast} />
    </InAppNotificationsContext.Provider>
  );
}
