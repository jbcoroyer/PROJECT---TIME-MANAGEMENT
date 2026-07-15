"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  Inbox,
  Link2,
  Pencil,
  Sparkles,
} from "lucide-react";
import {
  createIntakeForm,
  getOrgIntakeForm,
  type IntakeFormWithStats,
} from "../../../app/actions/intakeForm";
import { useBranding } from "../../../lib/brandingContext";
import { toastError, toastSuccess } from "../../../lib/toast";

type IntakeFormHubWorkspaceProps = {
  initialForm: IntakeFormWithStats | null;
};

export default function IntakeFormHubWorkspace({ initialForm }: IntakeFormHubWorkspaceProps) {
  const router = useRouter();
  const { branding } = useBranding();
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState(`Demandes ${branding.appName}`);
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Décrivez votre besoin en communication. Notre équipe qualifiera votre demande avant de la traiter.",
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const publicUrl =
    typeof window !== "undefined" && form
      ? `${window.location.origin}${form.publicPath}`
      : form?.publicPath ?? "";

  const handleCreate = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || creating) return;
    setCreating(true);
    const result = await createIntakeForm(cleanTitle, welcomeMessage);
    setCreating(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess("Votre espace de demandes est prêt.");
    const refreshed = await getOrgIntakeForm();
    setForm(refreshed);
    router.refresh();
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toastSuccess("Lien copié.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError("Copie impossible.");
    }
  };

  if (!form) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="ui-surface overflow-hidden rounded-2xl">
          <div className="border-b border-[var(--line)] bg-[var(--surface-soft)] px-6 py-8 sm:px-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Inbox className="h-7 w-7" />
            </div>
            <h1 className="ui-display mt-5 text-[2rem] leading-tight text-[var(--foreground)]">
              Créez votre espace de demandes
            </h1>
            <p className="mt-3 max-w-lg text-[15px] text-[var(--ink-muted)]">
              Configurez un formulaire client que vous pourrez partager par lien. Les personnes externes
              pourront soumettre des demandes sans accéder au reste de {branding.appName}.
            </p>
          </div>

          <div className="space-y-5 px-6 py-8 sm:px-8">
            <div className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <div className="text-sm text-[var(--ink-muted)]">
                <p className="font-semibold text-[var(--foreground)]">Comment ça marche</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>Créez votre formulaire (titre et message d&apos;accueil)</li>
                  <li>Partagez le lien public avec vos clients ou partenaires</li>
                  <li>Traitez les demandes reçues depuis l&apos;onglet « Traiter les demandes »</li>
                </ol>
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
              Titre du formulaire
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="ui-input normal-case"
                placeholder="Ex. Demandes communication"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
              Message d&apos;accueil
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="ui-input normal-case"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating || !title.trim()}
              className="ui-btn ui-btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              {creating ? "Création…" : "Créer mon espace de demandes"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="ui-surface rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{form.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {form.welcomeMessage || "Aucun message d'accueil."}
            </p>
            <Link
              href="/asks/edit"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" />
              Éditer le formulaire
            </Link>
          </div>
        </div>
      </header>

      <section className="ui-surface rounded-2xl p-6">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <Link2 className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">Lien public à partager</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Toute personne disposant de ce lien peut soumettre une demande. Elle n&apos;aura accès qu&apos;à
          ce formulaire, pas à votre espace {branding.appName}.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={publicUrl}
            className="ui-input flex-1 font-[family-name:var(--font-mono)] text-xs"
            aria-label="URL publique du formulaire"
          />
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="ui-btn ui-btn-secondary inline-flex shrink-0 items-center justify-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié" : "Copier"}
          </button>
          <a
            href={form.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-primary inline-flex shrink-0 items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Aperçu
          </a>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/asks/edit"
          className="ui-surface ui-transition group rounded-2xl p-5 hover:border-[var(--accent)]"
        >
          <Pencil className="h-6 w-6 text-[var(--accent)]" />
          <h3 className="mt-3 font-semibold text-[var(--foreground)]">Éditer les champs</h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Ajouter, supprimer et réordonner les questions du formulaire public.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] group-hover:underline">
            Ouvrir l&apos;éditeur
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          href="/asks/triage"
          className="ui-surface ui-transition group rounded-2xl p-5 hover:border-[var(--accent)]"
        >
          <Inbox className="h-6 w-6 text-[var(--accent)]" />
          <h3 className="mt-3 font-semibold text-[var(--foreground)]">Traiter les demandes</h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {form.requestCount > 0
              ? `${form.requestCount} demande${form.requestCount > 1 ? "s" : ""} reçue${form.requestCount > 1 ? "s" : ""}`
              : "Aucune demande pour le moment"}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] group-hover:underline">
            Ouvrir la file de triage
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      <div className="ui-surface rounded-2xl p-5">
        <Sparkles className="h-6 w-6 text-[var(--accent)]" />
        <h3 className="mt-3 font-semibold text-[var(--foreground)]">Accès externe</h3>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Les clients remplissent le formulaire public. Vous recevez les demandes dans votre file de
          triage, puis les convertissez en tâches.
        </p>
      </div>
    </div>
  );
}
