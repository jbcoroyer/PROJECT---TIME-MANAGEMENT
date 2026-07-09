"use client";

import { Check, Palette } from "lucide-react";
import {
  BRAND_COLOR_PRESET_GROUPS,
  findPresetByHex,
  isPresetColor,
  normalizeHexColor,
} from "../../lib/brandColorPresets";
import { useTranslation } from "../../lib/i18n/useTranslation";

type BrandColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
};

export default function BrandColorPicker({ value, onChange }: BrandColorPickerProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const normalizedValue = normalizeHexColor(value) || value;
  const activePreset = findPresetByHex(normalizedValue);
  const showCustom = !isPresetColor(normalizedValue);

  return (
    <div className="space-y-5">
      {BRAND_COLOR_PRESET_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/45">
            {t(group.labelKey)}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {group.presets.map((preset) => {
              const selected = normalizeHexColor(preset.hex) === normalizedValue;
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={t(preset.labelKey)}
                  aria-label={t(preset.labelKey)}
                  aria-pressed={selected}
                  onClick={() => onChange(preset.hex)}
                  className={[
                    "group relative flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition",
                    selected
                      ? "bg-[var(--surface-soft)] ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--surface)]"
                      : "hover:bg-[var(--surface-soft)]",
                  ].join(" ")}
                >
                  <span
                    className="relative flex h-10 w-full rounded-lg shadow-sm ring-1 ring-black/5"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {selected ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow-sm" strokeWidth={3} />
                      </span>
                    ) : null}
                  </span>
                  <span className="line-clamp-1 w-full text-center text-[10px] font-medium text-[color:var(--foreground)]/55">
                    {t(preset.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]/60 p-4">
        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Palette className="h-4 w-4" />
          {t("setup.customColor")}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={showCustom ? normalizedValue : activePreset?.hex ?? normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-[var(--line)] bg-transparent"
          />
          <input
            type="text"
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            className="ui-input flex-1 font-mono text-sm"
            placeholder="#2563EB"
            spellCheck={false}
          />
        </div>
        {showCustom ? (
          <p className="mt-2 text-xs text-[color:var(--foreground)]/50">{t("setup.customColorHint")}</p>
        ) : null}
      </div>
    </div>
  );
}
