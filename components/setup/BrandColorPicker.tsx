"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  BRAND_COLOR_PRESETS_DEFAULT,
  BRAND_COLOR_PRESETS_EXTENDED,
  findPresetByHex,
  normalizeHexColor,
} from "../../lib/brandColorPresets";
import { useTranslation } from "../../lib/i18n/useTranslation";

type BrandColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
};

function ColorSwatch({
  hex,
  label,
  selected,
  onSelect,
}: {
  hex: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        "group relative flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition",
        selected
          ? "bg-[var(--surface-soft)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]"
          : "hover:bg-[var(--surface-soft)]",
      ].join(" ")}
    >
      <span
        className="relative flex h-10 w-full rounded-lg shadow-sm ring-1 ring-black/5"
        style={{ backgroundColor: hex }}
      >
        {selected ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Check className="h-4 w-4 text-white drop-shadow-sm" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span className="line-clamp-1 w-full text-center text-[10px] font-medium text-[var(--ink-muted)]">
        {label}
      </span>
    </button>
  );
}

export default function BrandColorPicker({ value, onChange }: BrandColorPickerProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const normalizedValue = normalizeHexColor(value) || value;
  const activePreset = findPresetByHex(normalizedValue);
  const isExtended = BRAND_COLOR_PRESETS_EXTENDED.some(
    (p) => normalizeHexColor(p.hex) === normalizedValue,
  );
  const [showExtended, setShowExtended] = useState(isExtended);

  const presets = showExtended
    ? [...BRAND_COLOR_PRESETS_DEFAULT, ...BRAND_COLOR_PRESETS_EXTENDED]
    : BRAND_COLOR_PRESETS_DEFAULT;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {presets.map((preset) => {
          const selected = normalizeHexColor(preset.hex) === normalizedValue;
          return (
            <ColorSwatch
              key={preset.id}
              hex={preset.hex}
              label={t(preset.labelKey)}
              selected={selected}
              onSelect={() => onChange(preset.hex)}
            />
          );
        })}
      </div>

      {!showExtended ? (
        <button
          type="button"
          onClick={() => setShowExtended(true)}
          className="ui-transition inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
          {t("setup.moreColors")}
        </button>
      ) : null}

      {activePreset ? (
        <p className="text-xs text-[var(--ink-muted)]">
          {t("setup.selectedColor", { name: t(activePreset.labelKey) })}
        </p>
      ) : null}
    </div>
  );
}
