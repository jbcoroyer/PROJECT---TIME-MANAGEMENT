"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { completeInitialSetup } from "../../app/actions/setup";
import { AppMark } from "../AppBrand";
import BrandColorPicker from "./BrandColorPicker";
import ModuleCatalog from "./ModuleCatalog";
import { useBranding } from "../../lib/brandingContext";
import { LOCALE_OPTIONS, resolveLocale, type AppLocale } from "../../lib/i18n";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { APP_MARK_STORAGE_BUCKET } from "../../lib/storageBuckets";
import { uploadOrgFile } from "../../lib/storageClient";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { normalizeHexColor } from "../../lib/brandColorPresets";
import { DEFAULT_ONBOARDING_MODULES, getDefaultModuleRoute, type AppModuleId } from "../../lib/modules";
import { toastError, toastSuccess } from "../../lib/toast";
import "./setup-onboarding.css";

const TIMEZONE_OPTIONS = [
  { value: "Europe/Paris", labelKey: "setup.timezones.paris" },
  { value: "Europe/Brussels", labelKey: "setup.timezones.brussels" },
  { value: "Europe/Zurich", labelKey: "setup.timezones.zurich" },
  { value: "Europe/London", labelKey: "setup.timezones.london" },
  { value: "America/Montreal", labelKey: "setup.timezones.montreal" },
  { value: "UTC", labelKey: "setup.timezones.utc" },
] as const;

const SECTOR_OPTIONS = [
  { value: "", labelKey: "common.notSpecified" },
  { value: "communication", labelKey: "setup.sectors.communication" },
  { value: "events", labelKey: "setup.sectors.events" },
  { value: "consulting", labelKey: "setup.sectors.consulting" },
  { value: "industry", labelKey: "setup.sectors.industry" },
  { value: "other", labelKey: "setup.sectors.other" },
] as const;

type Step = 1 | 2 | 3 | 4;

export default function SetupWizard() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const { branding, reload, patchBranding } = useBranding();
  const { user } = useCurrentUser();
  const { t } = useTranslation({ preferBrowser: true });

  const [step, setStep] = useState<Step>(1);
  const [appName, setAppName] = useState(branding.appName === "Workspace" ? "" : branding.appName);
  const [tagline, setTagline] = useState(branding.tagline);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  /** Chemin storage enregistré en base (mark_url). */
  const [markStoragePath, setMarkStoragePath] = useState<string | null>(branding.markUrl);
  /** URL signée pour l'aperçu immédiat après upload. */
  const [markPreviewUrl, setMarkPreviewUrl] = useState<string | null>(branding.markUrl);
  const [timezone, setTimezone] = useState(branding.timezone);
  const [sector, setSector] = useState(branding.sector ?? "");
  const [locale, setLocale] = useState<AppLocale>(resolveLocale(branding.locale));
  const [enabledModules, setEnabledModules] = useState<AppModuleId[]>([...DEFAULT_ONBOARDING_MODULES]);
  const [markUploading, setMarkUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewName = appName.trim() || "Workspace";

  async function handleMarkUpload(file: File) {
    const organizationId = user?.organizationId ?? branding.organizationId;
    if (!organizationId) {
      toastError(t("setup.uploadFailed", { message: "Organisation introuvable." }));
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const allowed = ["png", "webp", "jpg", "jpeg", "gif", "svg"];
    if (!allowed.includes(ext)) {
      toastError(t("setup.markInvalidFormat"));
      return;
    }

    setMarkUploading(true);
    const relativePath = `app-mark-${Date.now()}.${ext}`;
    const upload = await uploadOrgFile(
      supabase,
      APP_MARK_STORAGE_BUCKET,
      organizationId,
      relativePath,
      file,
      { upsert: true, contentType: file.type || undefined },
    );
    if (!upload.ok) {
      toastError(t("setup.uploadFailed", { message: upload.error }));
      setMarkUploading(false);
      return;
    }
    setMarkStoragePath(upload.path);
    setMarkPreviewUrl(upload.signedUrl);
    setMarkUploading(false);
    toastSuccess(t("setup.markAdded"));
  }

  async function handleFinish() {
    const name = appName.trim();
    if (!name) {
      setError(t("setup.nameRequired"));
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await completeInitialSetup({
      appName: name,
      appShortName: name,
      tagline: tagline.trim(),
      primaryColor: normalizeHexColor(primaryColor) || primaryColor,
      markUrl: markStoragePath,
      timezone,
      sector: sector.trim() || null,
      locale,
      isConfigured: true,
      enabledModules,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    patchBranding({
      isConfigured: true,
      enabledModules,
      appName: name,
      appShortName: name,
      tagline: tagline.trim(),
      primaryColor: normalizeHexColor(primaryColor) || primaryColor,
      markUrl: markStoragePath,
      timezone,
      sector: sector.trim() || null,
      locale,
      organizationId: user?.organizationId ?? branding.organizationId,
    });

    toastSuccess(t("setup.complete"));
    router.replace(getDefaultModuleRoute(enabledModules));
    void reload();
  }

  return (
    <div style={{ ["--brand-primary" as string]: primaryColor }}>
    <div
      className={[
        "setup-glass rounded-3xl",
        step === 3 ? "p-5 sm:p-6 lg:p-7" : "p-6 lg:p-9",
      ].join(" ")}
    >
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--foreground)]/42">
            {t("setup.stepOf", { step })}
          </p>
          <h2 className="ui-display mt-1.5 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-[1.65rem]">
            {step === 1
              ? t("setup.step1Title")
              : step === 2
                ? t("setup.step2Title")
                : step === 3
                  ? t("setup.step3Title")
                  : t("setup.step4Title")}
          </h2>
        </div>
        <div className="setup-steps w-full max-w-xs sm:max-w-sm" aria-hidden>
          {([1, 2, 3, 4] as Step[]).map((n) => (
            <span
              key={n}
              className={[
                "setup-step-dot",
                n < step ? "setup-step-dot--done" : "",
                n === step ? "setup-step-dot--current" : "",
              ].join(" ")}
            >
              <span className="setup-step-dot__fill" />
            </span>
          ))}
        </div>
      </div>

      <div key={step} className="setup-step-panel">
      {step === 1 && (
        <div className="space-y-5">
          <p className="max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/68">{t("setup.step1Intro")}</p>
          <Field
            id="setup-app-name"
            label={t("setup.appName")}
            value={appName}
            onChange={setAppName}
            placeholder={t("setup.appNamePlaceholder")}
            required
          />
          <Field
            id="setup-tagline"
            label={t("setup.tagline")}
            value={tagline}
            onChange={setTagline}
            placeholder={t("setup.taglinePlaceholder")}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <p className="max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/68">{t("setup.step2Intro")}</p>

          <div className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--surface)] to-[color:var(--brand-primary)]/[0.06] p-5 sm:flex-row sm:items-center">
            <div
              className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_12px_32px_-12px_color-mix(in_srgb,var(--brand-primary)_25%,transparent)]"
              style={{ ["--brand-primary" as string]: primaryColor }}
            >
              {markPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={markPreviewUrl} alt="" className="h-14 w-14 object-contain" />
              ) : (
                <AppMark className="h-14 w-14" />
              )}
            </div>
            <div className="min-w-0">
              <p className="app-wordmark ui-display text-2xl text-[var(--foreground)]">{previewName}</p>
              {tagline.trim() ? (
                <p className="mt-1 text-sm text-[color:var(--foreground)]/55">{tagline.trim()}</p>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t("setup.primaryColor")}</p>
            <BrandColorPicker
              value={primaryColor}
              onChange={(hex) => setPrimaryColor(normalizeHexColor(hex) || hex)}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <ImageIcon className="h-4 w-4" />
              {t("setup.mark")}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="ui-transition inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold hover:bg-[var(--surface)]">
                {markUploading ? t("common.uploading") : t("common.upload")}
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg,image/gif,image/svg+xml"
                  className="sr-only"
                  disabled={markUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleMarkUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {markStoragePath || markPreviewUrl ? (
                <button
                  type="button"
                  disabled={markUploading}
                  onClick={() => {
                    setMarkStoragePath(null);
                    setMarkPreviewUrl(null);
                  }}
                  className="ui-transition rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
                >
                  {t("common.remove")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <ModuleCatalog variant="onboarding" value={enabledModules} onChange={setEnabledModules} />
      )}

      {step === 4 && (
        <div className="space-y-5">
          <p className="max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/68">{t("setup.step4Intro")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="setup-locale" className="mb-1.5 block text-sm font-semibold">
                {t("setup.locale")}
              </label>
              <select
                id="setup-locale"
                value={locale}
                onChange={(e) => setLocale(resolveLocale(e.target.value))}
                className="ui-input ui-focus-ring w-full"
              >
                {LOCALE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="setup-timezone" className="mb-1.5 block text-sm font-semibold">
                {t("setup.timezone")}
              </label>
              <select
                id="setup-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="ui-input ui-focus-ring w-full"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {t(tz.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="setup-sector" className="mb-1.5 block text-sm font-semibold">
              {t("setup.sector")}
            </label>
            <select
              id="setup-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="ui-input ui-focus-ring w-full"
            >
              {SECTOR_OPTIONS.map((s) => (
                <option key={s.value || "none"} value={s.value}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-emerald-50/40 px-5 py-4 text-sm text-emerald-950">
            <p className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              {t("setup.readyTitle")}
            </p>
            <p className="mt-1 text-emerald-900/85">
              {t("setup.readyBody", { name: previewName })}
            </p>
          </div>
        </div>
      )}
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 1 || submitting}
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
          className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)]/80 hover:bg-[var(--surface-soft)] disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !appName.trim()) {
                setError(t("setup.nameRequired"));
                return;
              }
              if (step === 3 && enabledModules.length === 0) {
                setError(t("setup.modulesRequired"));
                return;
              }
              setError(null);
              setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
            }}
            className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_color-mix(in_srgb,var(--brand-primary)_65%,transparent)] hover:opacity-92 hover:shadow-[0_14px_32px_-10px_color-mix(in_srgb,var(--brand-primary)_70%,transparent)]"
          >
            {t("common.continue")}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleFinish()}
            className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_color-mix(in_srgb,var(--brand-primary)_65%,transparent)] hover:opacity-92 disabled:opacity-60"
          >
            {submitting ? t("common.saving") : t("setup.finish")}
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)]/50 p-4 transition-shadow focus-within:border-[color:var(--brand-primary)]/30 focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-primary)_8%,transparent)]">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
        {label}
        {required ? <span className="ml-1 text-[var(--brand-primary)]">*</span> : null}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="ui-input ui-focus-ring w-full text-[15px]"
      />
    </div>
  );
}
