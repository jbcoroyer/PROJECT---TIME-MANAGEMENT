"use client";

import { useEffect, useState } from "react";
import { Layers, Save } from "lucide-react";
import CompactModulePicker from "./CompactModulePicker";
import { updateBranding } from "../../app/actions/branding";
import { useBranding } from "../../lib/brandingContext";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { type AppModuleId } from "../../lib/modules";
import { toastError, toastSuccess } from "../../lib/toast";

export default function ModulesSettingsSection() {
  const { branding, reload } = useBranding();
  const { t } = useTranslation();
  const [enabledModules, setEnabledModules] = useState<AppModuleId[]>(branding.enabledModules);
  const [saving, setSaving] = useState(false);
  const dirty =
    enabledModules.length !== branding.enabledModules.length ||
    enabledModules.some((id) => !branding.enabledModules.includes(id));

  useEffect(() => {
    queueMicrotask(() => setEnabledModules(branding.enabledModules));
  }, [branding.enabledModules]);

  async function handleSave() {
    if (enabledModules.length === 0) {
      toastError(t("settings.modulesMinOne"));
      return;
    }
    setSaving(true);
    const result = await updateBranding({ enabledModules });
    if (!result.ok) {
      toastError(result.error);
      setSaving(false);
      return;
    }
    await reload();
    toastSuccess(t("settings.modulesSaved"));
    setSaving(false);
  }

  return (
    <section id="settings-modules" className="scroll-mt-24">
      <div className="ui-surface overflow-hidden rounded-2xl">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-primary)]/10 text-[var(--brand-primary)]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("settings.modulesTitle")}</h2>
              <p className="mt-0.5 text-sm text-[color:var(--foreground)]/60">{t("settings.modulesSubtitle")}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <CompactModulePicker
            value={enabledModules}
            maxModules={null}
            onLimitError={() => undefined}
            onMinOneError={() => toastError(t("settings.modulesMinOne"))}
            onChange={(next) => {
              if (next.length === 0) {
                toastError(t("settings.modulesMinOne"));
                return;
              }
              setEnabledModules(next);
            }}
          />
        </div>

        {dirty ? (
          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-sm sm:px-5">
            <p className="text-sm text-[color:var(--foreground)]/65">{t("settings.modulesUnsaved")}</p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="ui-btn ui-btn-primary gap-2 px-4 py-2.5 text-sm"
            >
              <Save className="h-4 w-4" />
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
