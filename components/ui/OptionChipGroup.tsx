"use client";

export type OptionChipGroupProps<T extends string | number> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  disabled?: boolean;
  format?: (value: T) => string;
  className?: string;
};

export function OptionChipGroup<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  format = (v) => String(v),
  className = "",
}: OptionChipGroupProps<T>) {
  return (
    <div className={["flex flex-wrap gap-1.5", className].join(" ")}>
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={String(option)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm"
                : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]",
              disabled ? "cursor-not-allowed opacity-50" : "",
            ].join(" ")}
          >
            {format(option)}
          </button>
        );
      })}
    </div>
  );
}
