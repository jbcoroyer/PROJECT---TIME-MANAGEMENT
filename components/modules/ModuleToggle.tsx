"use client";

type ModuleToggleProps = {
  active: boolean;
  onChange: (next: boolean) => void;
  label: string;
};

/** Interrupteur on/off — dimensions fixes pour éviter les débordements. */
export default function ModuleToggle({ active, onChange, label }: ModuleToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!active);
      }}
      className={[
        "ui-transition relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        active
          ? "bg-[var(--brand-primary)]"
          : "bg-[var(--line-strong)]",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          active ? "translate-x-[1.375rem]" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}
