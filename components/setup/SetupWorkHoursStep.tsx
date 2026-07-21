"use client";

import { CalendarClock } from "lucide-react";
import type { SetupAvailabilityInput } from "../../lib/agenda/workHoursUtils";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { TimePicker } from "../ui/TimePicker";

type SetupWorkHoursStepProps = {
  value: SetupAvailabilityInput;
  onChange: (value: SetupAvailabilityInput) => void;
};

export default function SetupWorkHoursStep({ value, onChange }: SetupWorkHoursStepProps) {
  const { t } = useTranslation({ preferBrowser: true });

  const patch = (partial: Partial<SetupAvailabilityInput>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-[color:var(--foreground)]/65">
        {t("setup.workHours.intro")}
      </p>

      <label className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
        <input
          type="checkbox"
          checked={value.weekdaysEnabled}
          onChange={(e) => patch({ weekdaysEnabled: e.target.checked })}
          className="h-4 w-4 rounded border-[var(--line)]"
        />
        {t("setup.workHours.weekdaysLabel")}
      </label>

      <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
          <CalendarClock className="h-4 w-4" />
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {t("setup.workHours.scheduleTitle")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              {t("setup.workHours.morning")}
            </legend>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
              {t("setup.workHours.from")}
              <TimePicker
                value={value.morningStart}
                disabled={!value.weekdaysEnabled}
                onChange={(v) => patch({ morningStart: v })}
                minuteStep={15}
                className="ui-input w-full"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
              {t("setup.workHours.to")}
              <TimePicker
                value={value.morningEnd}
                disabled={!value.weekdaysEnabled}
                onChange={(v) => patch({ morningEnd: v })}
                minuteStep={15}
                className="ui-input w-full"
              />
            </label>
          </fieldset>

          <fieldset className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
              {t("setup.workHours.afternoon")}
            </legend>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
              {t("setup.workHours.from")}
              <TimePicker
                value={value.afternoonStart}
                disabled={!value.weekdaysEnabled}
                onChange={(v) => patch({ afternoonStart: v })}
                minuteStep={15}
                className="ui-input w-full"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-muted)]">
              {t("setup.workHours.to")}
              <TimePicker
                value={value.afternoonEnd}
                disabled={!value.weekdaysEnabled}
                onChange={(v) => patch({ afternoonEnd: v })}
                minuteStep={15}
                className="ui-input w-full"
              />
            </label>
          </fieldset>
        </div>

        <p className="mt-3 text-xs text-[var(--ink-muted)]">{t("setup.workHours.weekendHint")}</p>
      </div>
    </div>
  );
}
