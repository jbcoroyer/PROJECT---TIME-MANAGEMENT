"use client";

import { useMemo, useState } from "react";
import { Check, Pipette } from "lucide-react";
import {
  ACCENT_COLOR_CHOICE_COUNT,
  buildAccentColorChoices,
  findPresetByHex,
  hexToRgbComponents,
  normalizeHexColor,
  rgbComponentsToHex,
} from "../../lib/brandColorPresets";
import { useTranslation } from "../../lib/i18n/useTranslation";

type BrandColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  /** Couleurs extraites du logo — remplissent les 7 premières cases en priorité. */
  logoColors?: string[];
};

function clampChannel(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

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
        "group flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition",
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

function CustomRgbSwatch({
  value,
  selected,
  onChange,
}: {
  value: string;
  selected: boolean;
  onChange: (hex: string) => void;
}) {
  const { t } = useTranslation({ preferBrowser: true });
  const initial = hexToRgbComponents(value) ?? { r: 128, g: 128, b: 128 };
  const [r, setR] = useState(initial.r);
  const [g, setG] = useState(initial.g);
  const [b, setB] = useState(initial.b);

  const previewHex = rgbComponentsToHex(r, g, b);

  function commitChannel(nextR: number, nextG: number, nextB: number) {
    onChange(rgbComponentsToHex(nextR, nextG, nextB));
  }

  function handleFocus() {
    if (!selected) {
      onChange(previewHex);
    }
  }

  return (
    <div
      className={[
        "flex flex-col gap-1.5 rounded-xl p-1.5 transition",
        selected
          ? "bg-[var(--surface-soft)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]"
          : "hover:bg-[var(--surface-soft)]",
      ].join(" ")}
    >
      <span
        className="relative flex h-10 w-full items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5"
        style={{ backgroundColor: previewHex }}
      >
        <Pipette className="h-4 w-4 text-white drop-shadow-sm" aria-hidden />
      </span>
      <p className="text-center text-[10px] font-semibold text-[var(--ink-muted)]">{t("setup.customColor")}</p>
      <div className="grid grid-cols-3 gap-1">
        {(
          [
            ["R", r, setR],
            ["G", g, setG],
            ["B", b, setB],
          ] as const
        ).map(([channel, channelValue, setChannel]) => (
          <label key={channel} className="flex flex-col gap-0.5">
            <span className="text-[9px] font-semibold uppercase text-[var(--ink-muted)]">{channel}</span>
            <input
              type="number"
              min={0}
              max={255}
              value={channelValue}
              onFocus={handleFocus}
              onChange={(e) => {
                const next = clampChannel(Number(e.target.value));
                setChannel(next);
                const nextR = channel === "R" ? next : r;
                const nextG = channel === "G" ? next : g;
                const nextB = channel === "B" ? next : b;
                commitChannel(nextR, nextG, nextB);
              }}
              className="ui-input h-7 w-full px-1 py-0 text-center text-[11px] tabular-nums"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function BrandColorPicker({ value, onChange, logoColors }: BrandColorPickerProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const normalizedValue = normalizeHexColor(value) || value;
  const suggestedColors = useMemo(() => buildAccentColorChoices(logoColors), [logoColors]);
  const isCustomSelected = !suggestedColors.includes(normalizedValue);
  const activePreset = findPresetByHex(normalizedValue);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--ink-muted)]">{t("setup.accentColorsHint")}</p>

      <div className="grid grid-cols-4 gap-2">
        {suggestedColors.slice(0, ACCENT_COLOR_CHOICE_COUNT).map((hex, index) => {
          const preset = findPresetByHex(hex);
          const label = preset ? t(preset.labelKey) : hex;
          const selected = hex === normalizedValue;
          return (
            <ColorSwatch
              key={`${hex}-${index}`}
              hex={hex}
              label={label}
              selected={selected}
              onSelect={() => onChange(hex)}
            />
          );
        })}
        <CustomRgbSwatch
          key={isCustomSelected ? "custom-on" : "custom-off"}
          value={normalizedValue}
          selected={isCustomSelected}
          onChange={onChange}
        />
      </div>

      {activePreset ? (
        <p className="text-xs text-[var(--ink-muted)]">
          {t("setup.selectedColor", { name: t(activePreset.labelKey) })}
        </p>
      ) : isCustomSelected ? (
        <p className="text-xs text-[var(--ink-muted)]">
          {t("setup.selectedLogoColor", { hex: normalizedValue })}
        </p>
      ) : null}
    </div>
  );
}
