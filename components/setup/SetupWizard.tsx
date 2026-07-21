"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { completeInitialSetup } from "../../app/actions/setup";
import { uploadOrgAsset } from "../../app/actions/storage";
import { AppMark } from "../AppBrand";
import BrandColorPicker from "./BrandColorPicker";
import { extractAccentColorsFromFile, extractAccentColorsFromImageSource } from "../../lib/detectLogoAccentColor";
import { isImageWithinServerActionLimit } from "../../lib/imageUploadLimits";
import ModuleQuestionnaire from "./ModuleQuestionnaire";
import SetupWorkHoursStep from "./SetupWorkHoursStep";
import { TRIAL_DAYS } from "../../lib/billing/plans";
import { brandingStyleVars } from "../../lib/branding";
import { useBranding } from "../../lib/brandingContext";
import { LOCALE_OPTIONS, detectBrowserLocale, resolveLocale, type AppLocale } from "../../lib/i18n";
import { readStoredLocale } from "../../lib/i18n/localeStorage";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { APP_MARK_STORAGE_BUCKET } from "../../lib/storageBuckets";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { normalizeHexColor } from "../../lib/brandColorPresets";
import { DEFAULT_ONBOARDING_MODULES, getDefaultModuleRoute, type AppModuleId } from "../../lib/modules";
import {
  buildWorkHoursFromSetup,
  DEFAULT_SETUP_AVAILABILITY,
  type SetupAvailabilityInput,
} from "../../lib/agenda/workHoursUtils";
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

type Step = 1 | 2 | 3 | 4 | 5;

function initialAppName(brandingName: string): string {
  const name = brandingName.trim();
  if (!name || name === "Workspace") return "";
  return name;
}

type SetupWizardProps = {
  onAccentChange?: (hex: string) => void;
  localeOverride?: AppLocale;
  onLocaleChange?: (locale: AppLocale) => void;
};

export default function SetupWizard({ onAccentChange, localeOverride, onLocaleChange }: SetupWizardProps) {
  const router = useRouter();
  const { branding, reload, patchBranding } = useBranding();
  const { user } = useCurrentUser();
  const { t } = useTranslation({ preferBrowser: true, localeOverride });

  const [step, setStep] = useState<Step>(1);
  const [appName, setAppName] = useState(() => initialAppName(branding.appName));
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [markStoragePath, setMarkStoragePath] = useState<string | null>(branding.markUrl);
  const [markPreviewUrl, setMarkPreviewUrl] = useState<string | null>(branding.markUrl);
  const [timezone, setTimezone] = useState(branding.timezone);
  const [sector, setSector] = useState(branding.sector ?? "");
  const [locale, setLocale] = useState<AppLocale>(() => readStoredLocale() ?? detectBrowserLocale());
  const [enabledModules, setEnabledModules] = useState<AppModuleId[]>([...DEFAULT_ONBOARDING_MODULES]);
  const [availability, setAvailability] = useState<SetupAvailabilityInput>(DEFAULT_SETUP_AVAILABILITY);
  const [markUploading, setMarkUploading] = useState(false);
  const [logoAccentColors, setLogoAccentColors] = useState<string[]>([]);
  const [modulePhase, setModulePhase] = useState<"questions" | "recommendation">("questions");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydratedFromBranding, setHydratedFromBranding] = useState(false);

  useEffect(() => {
    if (hydratedFromBranding) return;
    if (!branding.organizationId && branding.appName === "Workspace") return;

    queueMicrotask(() => {
      const name = initialAppName(branding.appName);
      if (name && !appName.trim()) setAppName(name);
      if (branding.primaryColor) {
        const hex = normalizeHexColor(branding.primaryColor) || branding.primaryColor;
        setPrimaryColor(hex);
      }
      setHydratedFromBranding(true);
    });
  }, [appName, branding, hydratedFromBranding]);

  const selectedLocale = localeOverride ? resolveLocale(localeOverride) : locale;

  useEffect(() => {
    onAccentChange?.(normalizeHexColor(primaryColor) || primaryColor);
  }, [onAccentChange, primaryColor]);

  useEffect(() => {
    if (step !== 2 || !markPreviewUrl || logoAccentColors.length > 0) return;
    let cancelled = false;
    void extractAccentColorsFromImageSource(markPreviewUrl, 7).then((colors) => {
      if (!cancelled && colors.length > 0) {
        setLogoAccentColors(colors);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step, markPreviewUrl, logoAccentColors.length]);

  const previewName = appName.trim() || branding.appName || "Workspace";
  const organizationId = user?.organizationId ?? branding.organizationId;
  const includesWorkspace = enabledModules.includes("workspace");
  const totalSteps: Step = includesWorkspace ? 5 : 4;

  function validateAvailability(): string | null {
    if (!includesWorkspace || !availability.weekdaysEnabled) return null;
    if (availability.morningStart >= availability.morningEnd) {
      return t("setup.workHours.invalidMorning");
    }
    if (availability.afternoonStart >= availability.afternoonEnd) {
      return t("setup.workHours.invalidAfternoon");
    }
    if (availability.morningEnd > availability.afternoonStart) {
      return t("setup.workHours.invalidBreak");
    }
    return null;
  }

  async function handleMarkUpload(file: File) {
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

    if (!isImageWithinServerActionLimit(file)) {
      toastError(t("common.imageTooLarge"));
      return;
    }

    const extractedColors = await extractAccentColorsFromFile(file, 7);
    if (extractedColors.length > 0) {
      setLogoAccentColors(extractedColors);
      setPrimaryColor(extractedColors[0]);
    }

    setMarkUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const upload = await uploadOrgAsset(
      formData,
      APP_MARK_STORAGE_BUCKET,
      `app-mark-${Date.now()}.${ext}`,
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

    const availabilityError = validateAvailability();
    if (availabilityError) {
      setError(availabilityError);
      setSubmitting(false);
      if (includesWorkspace) setStep(5);
      return;
    }

    const result = await completeInitialSetup({
      appName: name,
      appShortName: name,
      tagline: "",
      primaryColor: normalizeHexColor(primaryColor) || primaryColor,
      markUrl: markStoragePath,
      timezone,
      sector: sector.trim() || null,
      locale: selectedLocale,
      isConfigured: true,
      enabledModules,
      setupWorkHours: includesWorkspace ? buildWorkHoursFromSetup(availability) : undefined,
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
      tagline: "",
      primaryColor: normalizeHexColor(primaryColor) || primaryColor,
      markUrl: markStoragePath,
      timezone,
      sector: sector.trim() || null,
      locale: selectedLocale,
      organizationId,
    });

    toastSuccess(t("setup.complete"));
    const destination = getDefaultModuleRoute(enabledModules);
    router.replace(`${destination}${destination.includes("?") ? "&" : "?"}tour=1`);
    void reload();
  }

  const stepTitle =
    step === 1
      ? t("setup.step1Title")
      : step === 2
        ? t("setup.step2Title")
        : step === 3
          ? t("setup.step3Title")
          : step === 4
            ? t("setup.step4Title")
            : t("setup.step5Title");

  return (
    <div style={brandingStyleVars(primaryColor) as CSSProperties}>
      <div className="setup-glass rounded-[var(--radius-xl)] p-5 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-mono-label uppercase">
              {t("setup.stepOfWithTotal", { step, total: totalSteps }).replace(/\s/g, " ").toUpperCase()}
            </p>
            <h2 className="ui-heading mt-1.5 text-[21px] text-[var(--foreground)] sm:text-[1.35rem]">
              {stepTitle}
            </h2>
          </div>
          <div className="setup-steps w-full max-w-[14rem] sm:max-w-[16rem]" aria-hidden>
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
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
              <p className="text-sm leading-relaxed text-[color:var(--foreground)]/65">
                {t("setup.step1Intro")}
              </p>
              <Field
                id="setup-app-name"
                label={t("setup.appName")}
                value={appName}
                onChange={setAppName}
                placeholder={t("setup.appNamePlaceholder")}
                required
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{t("setup.step2Intro")}</p>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                  <ImageIcon className="h-4 w-4" />
                  {t("setup.mark")}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="ui-btn ui-btn-secondary cursor-pointer">
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
                        setLogoAccentColors([]);
                      }}
                      className="ui-btn ui-btn-ghost"
                    >
                      {t("common.remove")}
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-[var(--ink-muted)]">{t("setup.markHint")}</p>
              </div>

              <div className="setup-brand-preview flex flex-col gap-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-soft)] p-5 sm:flex-row sm:items-center">
                <div className="setup-brand-preview__mark relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)]">
                  {markPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={markPreviewUrl} alt="" className="h-12 w-12 object-contain" />
                  ) : (
                    <AppMark className="h-12 w-12" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="app-wordmark ui-display text-xl text-[var(--foreground)]">{previewName}</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t("setup.primaryColor")}</p>
                <BrandColorPicker
                  value={primaryColor}
                  onChange={(hex) => setPrimaryColor(normalizeHexColor(hex) || hex)}
                  logoColors={logoAccentColors}
                />
                <AccentLivePreview />
              </div>
            </div>
          )}

          {step === 3 && (
            <ModuleQuestionnaire
              value={enabledModules}
              onChange={setEnabledModules}
              onPhaseChange={setModulePhase}
            />
          )}

          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-[color:var(--foreground)]/65">{t("setup.step4Intro")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="setup-locale" className="mb-1.5 block text-sm font-semibold">
                    {t("setup.locale")}
                  </label>
                  <select
                    id="setup-locale"
                    value={selectedLocale}
                    onChange={(e) => {
                      const next = resolveLocale(e.target.value);
                      setLocale(next);
                      onLocaleChange?.(next);
                    }}
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

              <div className="ui-alert ui-alert-success rounded-[var(--radius-lg)] px-5 py-4 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  {t("setup.readyTitle")}
                </p>
                <p className="mt-1 opacity-90">{t("setup.readyBody", { name: previewName })}</p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--accent)]/25 bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                  {t("setup.trialKicker", { days: TRIAL_DAYS })}
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
                  {t("setup.trialTitle", { days: TRIAL_DAYS })}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-muted)]">
                  {t("setup.trialBody")}
                </p>
              </div>
            </div>
          )}

          {step === 5 && includesWorkspace ? (
            <SetupWorkHoursStep value={availability} onChange={setAvailability} />
          ) : null}
        </div>

        {error ? (
          <div className="ui-alert ui-alert-danger mt-5 text-sm">{error}</div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
          <button
            type="button"
            disabled={step === 1 || submitting}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            className="ui-btn ui-btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !appName.trim()) {
                  setError(t("setup.nameRequired"));
                  return;
                }
                if (step === 3 && modulePhase !== "recommendation") {
                  setError(t("setup.moduleQuiz.finishFirst"));
                  return;
                }
                if (step === 3 && enabledModules.length === 0) {
                  setError(t("setup.modulesRequired"));
                  return;
                }
                if (step === 5) {
                  const availabilityError = validateAvailability();
                  if (availabilityError) {
                    setError(availabilityError);
                    return;
                  }
                }
                setError(null);
                setStep((s) => (s < totalSteps ? ((s + 1) as Step) : s));
              }}
              className="ui-btn ui-btn-primary"
            >
              {t("common.continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleFinish()}
              className="ui-btn ui-btn-primary"
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

function AccentLivePreview() {
  const { t } = useTranslation({ preferBrowser: true });

  return (
    <div className="setup-accent-live" aria-live="polite">
      <p className="setup-accent-live__label">{t("setup.accentPreview")}</p>
      <div className="setup-accent-live__demo">
        <div className="setup-accent-live__header">
          <span className="setup-accent-live__kicker">{t("setup.accentPreviewModule")}</span>
        </div>
        <div className="setup-accent-live__row">
          <span className="setup-accent-live__pill">{t("setup.accentPreviewPill")}</span>
          <span className="setup-accent-live__steps" aria-hidden>
            <span />
            <span className="setup-accent-live__steps-active" />
            <span />
          </span>
        </div>
        <div className="setup-accent-live__progress" aria-hidden>
          <span className="setup-accent-live__progress-fill" />
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
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-4">
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
        autoFocus={autoFocus}
        className="ui-input ui-focus-ring w-full border-[var(--line)] bg-[var(--surface-soft)]"
      />
    </div>
  );
}
