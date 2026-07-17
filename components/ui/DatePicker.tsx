"use client";

import {
  forwardRef,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type Ref,
} from "react";
import { startOfMonth } from "date-fns";
import { CalendarDays } from "lucide-react";
import { getDateFnsLocale } from "../../lib/i18n/dateFnsLocale";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { parseIsoDate } from "../../lib/dateTime/datePickerUtils";
import { CalendarGrid, isoToDisplayDate } from "./CalendarGrid";
import { usePopoverDismiss } from "./usePopoverDismiss";

export type DatePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "min" | "max"
> & {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  clearable?: boolean;
  compact?: boolean;
  inputRef?: Ref<HTMLInputElement>;
};

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    value,
    onChange,
    min,
    max,
    placeholder,
    clearable = true,
    compact = false,
    disabled,
    id: idProp,
    name,
    onBlur,
    className = "",
    inputRef,
    ...rest
  },
  ref,
) {
  const { t, locale } = useTranslation();
  const dateLocale = useMemo(() => getDateFnsLocale(locale), [locale]);
  const autoId = useId();
  const id = idProp ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selectedDate ?? new Date()),
  );

  usePopoverDismiss(open, rootRef, () => setOpen(false));

  const labels = useMemo(
    () => ({
      today: t("datePicker.today"),
      clear: t("datePicker.clear"),
      prevMonth: t("datePicker.prevMonth"),
      nextMonth: t("datePicker.nextMonth"),
    }),
    [t],
  );

  const display = value ? isoToDisplayDate(value, dateLocale) : "";
  const placeholderText = placeholder ?? t("datePicker.selectDate");

  const handleSelect = (iso: string) => {
    onChange(iso);
    setOpen(false);
    onBlur?.({ target: { name, value: iso } } as React.FocusEvent<HTMLInputElement>);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
    onBlur?.({ target: { name, value: "" } } as React.FocusEvent<HTMLInputElement>);
  };

  const openPicker = () => {
    if (disabled) return;
    setViewMonth(startOfMonth(selectedDate ?? new Date()));
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={ref ?? inputRef}
        type="hidden"
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        {...rest}
      />
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={id}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        className={[
          "ui-input flex w-full items-center gap-2 text-left",
          compact ? "px-2 py-1.5 text-xs" : "",
          disabled ? "cursor-not-allowed opacity-55" : "",
          className,
        ].join(" ")}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
        <span className={display ? "text-[var(--foreground)]" : "text-[var(--ink-muted)]"}>
          {display || placeholderText}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          className="ui-surface absolute left-0 top-[calc(100%+0.35rem)] z-[80] rounded-2xl border border-[var(--line)] p-3 shadow-[var(--shadow-2)]"
        >
          <CalendarGrid
            viewMonth={viewMonth}
            onViewMonthChange={setViewMonth}
            selected={value || undefined}
            onSelect={handleSelect}
            min={min}
            max={max}
            locale={dateLocale}
            labels={labels}
            onClear={clearable ? handleClear : undefined}
          />
        </div>
      ) : null}
    </div>
  );
});
