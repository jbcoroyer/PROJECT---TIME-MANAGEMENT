"use client";

import { LOCALE_OPTIONS, resolveLocale, type AppLocale } from "../../lib/i18n";

type LocalePickerProps = {
  id?: string;
  value: AppLocale;
  onChange: (locale: AppLocale) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: string;
};

export default function LocalePicker({
  id = "app-locale",
  value,
  onChange,
  disabled,
  className = "ui-input max-w-xs",
  label,
  hint,
}: LocalePickerProps) {
  return (
    <div>
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
          {label}
        </label>
      ) : null}
      {hint ? <p className="mb-2 text-xs text-[color:var(--foreground)]/55">{hint}</p> : null}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(resolveLocale(e.target.value))}
        className={className}
      >
        {LOCALE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
