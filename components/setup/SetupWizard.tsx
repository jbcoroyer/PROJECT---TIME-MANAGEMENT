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
import { useBranding } from "../../lib/brandingContext";
import { LOCALE_OPTIONS, resolveLocale, type AppLocale } from "../../lib/i18n";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { APP_MARK_STORAGE_BUCKET } from "../../lib/storageBuckets";
import { normalizeHexColor } from "../../lib/brandColorPresets";
import { toastError, toastSuccess } from "../../lib/toast";

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

type Step = 1 | 2 | 3;

export default function SetupWizard() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const { branding, reload } = useBranding();
  const { t } = useTranslation({ preferBrowser: true });

  const [step, setStep] = useState<Step>(1);
  const [appName, setAppName] = useState(branding.appName === "Workspace" ? "" : branding.appName);
  const [tagline, setTagline] = useState(branding.tagline);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [markUrl, setMarkUrl] = useState<string | null>(branding.markUrl);
  const [timezone, setTimezone] = useState(branding.timezone);
  const [sector, setSector] = useState(branding.sector ?? "");
  const [locale, setLocale] = useState<AppLocale>(resolveLocale(branding.locale));
  const [markUploading, setMarkUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewName = appName.trim() || "Workspace";

  async function handleMarkUpload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const allowed = ["png", "webp", "jpg", "jpeg", "gif", "svg"];
    if (!allowed.includes(ext)) {
      toastError(t("setup.markInvalidFormat"));
      return;
    }

    setMarkUploading(true);
    const path = `app-mark-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(APP_MARK_STORAGE_BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (upErr) {
      toastError(t("setup.uploadFailed", { message: upErr.message }));
      setMarkUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(APP_MARK_STORAGE_BUCKET).getPublicUrl(path);
    setMarkUrl(publicUrl);
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
      markUrl,
      timezone,
      sector: sector.trim() || null,
      locale,
      isConfigured: true,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    await reload();
    toastSuccess(t("setup.complete"));
    router.replace("/dashboard/kanban");
  }

  return (
    <div style={{ ["--brand-primary" as string]: primaryColor }}>
    <div className="ui-surface rounded-2xl p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/45">
            {t("setup.stepOf", { step })}
          </p>
          <h2 className="ui-display mt-1 text-2xl font-bold text-[var(--foreground)]">
            {step === 1 ? t("setup.step1Title") : step === 2 ? t("setup.step2Title") : t("setup.step3Title")}
          </h2>
        </div>
        <div className="flex gap-1.5">
          {([1, 2, 3] as Step[]).map((n) => (
            <span
              key={n}
              className={[
                "h-2 w-8 rounded-full transition",
                n <= step ? "bg-[var(--brand-primary)]" : "bg-[var(--line)]",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-[color:var(--foreground)]/70">{t("setup.step1Intro")}</p>
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
          <p className="text-sm text-[color:var(--foreground)]/70">{t("setup.step2Intro")}</p>

          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-5 sm:flex-row sm:items-center">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
              style={{ ["--brand-primary" as string]: primaryColor }}
            >
              {markUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={markUrl} alt="" className="h-14 w-14 object-contain" />
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
              {markUrl ? (
                <button
                  type="button"
                  disabled={markUploading}
                  onClick={() => setMarkUrl(null)}
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
        <div className="space-y-5">
          <p className="text-sm text-[color:var(--foreground)]/70">{t("setup.step3Intro")}</p>
          <div>
            <label htmlFor="setup-locale" className="mb-1.5 block text-sm font-semibold">
              {t("setup.locale")}
            </label>
            <select
              id="setup-locale"
              value={locale}
              onChange={(e) => setLocale(resolveLocale(e.target.value))}
              className="ui-input w-full"
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
              className="ui-input w-full"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {t(tz.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="setup-sector" className="mb-1.5 block text-sm font-semibold">
              {t("setup.sector")}
            </label>
            <select
              id="setup-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="ui-input w-full"
            >
              {SECTOR_OPTIONS.map((s) => (
                <option key={s.value || "none"} value={s.value}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
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

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !appName.trim()) {
                setError(t("setup.nameRequired"));
                return;
              }
              setError(null);
              setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
            }}
            className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("common.continue")}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleFinish()}
            className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
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
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="ui-input w-full"
      />
    </div>
  );
}
