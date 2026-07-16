"use client";

import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import { getInventoryErrorMessage, useInventory } from "../../lib/useInventory";
import { toastError, toastSuccess } from "../../lib/toast";
import { formatInventorySelectOptionLabel } from "../../lib/stockUtils";
import { useTranslation } from "../../lib/i18n/useTranslation";

type EventStockReserveProps = {
  eventId: string;
  defaultUserName: string;
};

export default function EventStockReserve(props: EventStockReserveProps) {
  const { t } = useTranslation();
  const { eventId, defaultUserName } = props;
  const { items, loading, recordMovement } = useInventory();
  const [itemId, setItemId] = useState<string>("");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [userName, setUserName] = useState(defaultUserName);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReason(t("eventsLegacy.stock.defaultReason"));
  }, [t]);

  useEffect(() => {
    setUserName(defaultUserName);
  }, [defaultUserName]);

  const selected = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) {
      toastError(t("eventsLegacy.stock.toast.chooseItem"));
      return;
    }
    const n = Math.max(1, Math.round(Number(qty) || 0));
    if (!userName.trim()) {
      toastError(t("eventsLegacy.stock.toast.nameRequired"));
      return;
    }
    if (selected && n > selected.quantity) {
      toastError(t("eventsLegacy.stock.toast.quantityExceeded"));
      return;
    }
    setSubmitting(true);
    try {
      await recordMovement({
        itemId,
        changeAmount: -n,
        projectId: null,
        eventId,
        reason: reason.trim() || t("eventsLegacy.stock.defaultExitReason"),
        userName: userName.trim(),
      });
      toastSuccess(t("eventsLegacy.stock.toast.success"));
      setQty("1");
    } catch (err) {
      toastError(getInventoryErrorMessage(err, t("eventsLegacy.stock.toast.error")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground)]/65">
        <Package className="h-3.5 w-3.5" />
        {t("eventsLegacy.stock.reserveTitle")}
      </div>
      <p className="mb-4 text-sm text-[color:var(--foreground)]/60">
        {t("eventsLegacy.stock.reserveDescription")}
      </p>
      {loading ? (
        <p className="text-sm text-[color:var(--foreground)]/55">{t("eventsLegacy.stock.loading")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("eventsLegacy.stock.item")}</label>
            <select
              value={itemId}
              onChange={(ev) => setItemId(ev.target.value)}
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm"
            >
              <option value="">{t("eventsLegacy.stock.selectPlaceholder")}</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {formatInventorySelectOptionLabel(it)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("eventsLegacy.stock.quantity")}</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(ev) => setQty(ev.target.value)}
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("eventsLegacy.stock.performedBy")}</label>
            <input
              value={userName}
              onChange={(ev) => setUserName(ev.target.value)}
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("eventsLegacy.stock.comment")}</label>
            <input
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !itemId}
              className="ui-transition rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? t("eventsLegacy.stock.submitting") : t("eventsLegacy.stock.submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
