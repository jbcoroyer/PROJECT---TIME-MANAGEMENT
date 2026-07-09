"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImageIcon,
  Palette,
  Sparkles,
} from "lucide-react";
import { completeInitialSetup } from "../../app/actions/setup";
import { AppMark } from "../AppBrand";
import { useBranding } from "../../lib/brandingContext";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { toastError, toastSuccess } from "../../lib/toast";

const TIMEZONE_OPTIONS = [
  { value: "Europe/Paris", label: "Paris (France)" },
  { value: "Europe/Brussels", label: "Bruxelles (Belgique)" },
  { value: "Europe/Zurich", label: "Zurich (Suisse)" },
  { value: "Europe/London", label: "Londres (Royaume-Uni)" },
  { value: "America/Montreal", label: "Montréal (Canada)" },
  { value: "UTC", label: "UTC" },
] as const;

const SECTOR_OPTIONS = [
  { value: "", label: "Non précisé" },
  { value: "communication", label: "Communication & marketing" },
  { value: "events", label: "Événementiel" },
  { value: "consulting", label: "Conseil & services" },
  { value: "industry", label: "Industrie" },
  { value: "other", label: "Autre" },
] as const;

type Step = 1 | 2 | 3;

export default function SetupWizard() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const { branding, reload } = useBranding();

  const [step, setStep] = useState<Step>(1);
  const [appName, setAppName] = useState(branding.appName === "Workspace" ? "" : branding.appName);
  const [tagline, setTagline] = useState(branding.tagline);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [markUrl, setMarkUrl] = useState<string | null>(branding.markUrl);
  const [timezone, setTimezone] = useState(branding.timezone);
  const [sector, setSector] = useState(branding.sector ?? "");
  const [markUploading, setMarkUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewName = appName.trim() || "Workspace";

  async function handleMarkUpload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const allowed = ["png", "webp", "jpg", "jpeg", "gif", "svg"];
    if (!allowed.includes(ext)) {
      toastError("Utilisez PNG, WebP, JPG, GIF ou SVG.");
      return;
    }

    setMarkUploading(true);
    const path = `app-mark-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("idena-mark").upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (upErr) {
      toastError(`Envoi impossible : ${upErr.message}`);
      setMarkUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("idena-mark").getPublicUrl(path);
    setMarkUrl(publicUrl);
    setMarkUploading(false);
    toastSuccess("Pictogramme ajouté.");
  }

  async function handleFinish() {
    const name = appName.trim();
    if (!name) {
      setError("Indiquez le nom de votre espace de travail.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await completeInitialSetup({
      appName: name,
      appShortName: name,
      tagline: tagline.trim(),
      primaryColor,
      markUrl,
      timezone,
      sector: sector.trim() || null,
      isConfigured: true,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    await reload();
    toastSuccess("Installation terminée. Bienvenue !");
    router.replace("/v2/dashboard/kanban");
  }

  return (
    <div style={{ ["--brand-primary" as string]: primaryColor }}>
    <div className="ui-surface rounded-2xl p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/45">
            Étape {step} sur 3
          </p>
          <h2 className="ui-display mt-1 text-2xl font-bold text-[var(--foreground)]">
            {step === 1 ? "Votre organisation" : step === 2 ? "Apparence" : "Derniers réglages"}
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
          <p className="text-sm text-[color:var(--foreground)]/70">
            Donnez un nom à votre espace. Ce nom apparaîtra dans le menu, sur la page de connexion et dans
            l&apos;onglet du navigateur.
          </p>
          <Field
            id="setup-app-name"
            label="Nom de l'application"
            value={appName}
            onChange={setAppName}
            placeholder="Ex. Mon équipe, Agence Dupont…"
            required
          />
          <Field
            id="setup-tagline"
            label="Slogan (facultatif)"
            value={tagline}
            onChange={setTagline}
            placeholder="Ex. Pilotage des projets et de la communication"
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <p className="text-sm text-[color:var(--foreground)]/70">
            Choisissez une couleur principale et, si vous le souhaitez, votre propre pictogramme.
          </p>

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
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <Palette className="h-4 w-4" />
              Couleur principale
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--line)] bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="ui-input flex-1"
                placeholder="#2563eb"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <ImageIcon className="h-4 w-4" />
              Pictogramme (facultatif)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="ui-transition inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold hover:bg-[var(--surface)]">
                {markUploading ? "Envoi…" : "Choisir une image"}
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
                  Retirer
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <p className="text-sm text-[color:var(--foreground)]/70">
            Ces réglages peuvent être modifiés plus tard dans les paramètres.
          </p>
          <div>
            <label htmlFor="setup-timezone" className="mb-1.5 block text-sm font-semibold">
              Fuseau horaire
            </label>
            <select
              id="setup-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="ui-input w-full"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="setup-sector" className="mb-1.5 block text-sm font-semibold">
              Secteur d&apos;activité (facultatif)
            </label>
            <select
              id="setup-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="ui-input w-full"
            >
              {SECTOR_OPTIONS.map((s) => (
                <option key={s.value || "none"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <p className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              Prêt à démarrer
            </p>
            <p className="mt-1 text-emerald-900/85">
              Votre espace <strong>{previewName}</strong> sera configuré et vous serez administrateur si
              aucun admin n&apos;existe encore.
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
          Retour
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !appName.trim()) {
                setError("Indiquez le nom de votre espace de travail.");
                return;
              }
              setError(null);
              setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
            }}
            className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Continuer
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleFinish()}
            className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Enregistrement…" : "Terminer l'installation"}
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
