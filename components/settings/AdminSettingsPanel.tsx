"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ImageIcon,
  Layers,
  PenLine,
  Plus,
  RefreshCw,
  Trash2,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import AdminAvatar from "../AdminAvatar";
import OutlookConnectionCard from "../OutlookConnectionCard";
import BillingCard from "./BillingCard";
import CompanyAvatar from "../CompanyAvatar";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { toastError, toastSuccess } from "../../lib/toast";
import { AppMark } from "../AppBrand";
import { useBranding } from "../../lib/brandingContext";
import { updateBranding } from "../../app/actions/branding";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { syncAdminColorAssignments } from "../../lib/adminColorAssignments";
import { adminSolidColorFor, getAdminColorPaletteSize } from "../../lib/kanbanStyles";
import type { AdminId } from "../../lib/types";
import { parsePrintSpecies, parseSocialThematics } from "../../lib/taxonomies";
import { LOCALE_OPTIONS, resolveLocale, type AppLocale } from "../../lib/i18n";
import { APP_MARK_STORAGE_BUCKET } from "../../lib/storageBuckets";
import { uploadOrgAsset } from "../../app/actions/storage";

/* ─────────────────────────── Types ─────────────────────────── */
type TeamMemberRow = {
  id: string;
  display_name: string;
  is_active: boolean;
  sort_order: number;
  avatar_url?: string | null;
};
type CompanyRow = { id: string; name: string; is_active: boolean; sort_order: number; logo_url?: string | null };
type DomainRow = {
  id: string;
  name: string;
  color: string | null;
  is_active: boolean;
  sort_order: number;
};
type ColumnRow = { id: string; name: string; is_active: boolean; sort_order: number };


function splitDomainName(value: string) {
  const name = value.trim();
  const match = name.match(/^(\p{Extended_Pictographic}(?:\uFE0F)?)\s+(.*)$/u);
  if (!match) return { emoji: "", label: name };
  return { emoji: match[1] ?? "", label: (match[2] ?? "").trim() };
}

/* ─────────────────────────── Modale de confirmation ─────────────────────────── */
function ConfirmDeleteModal(props: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_34px_90px_rgba(20,17,13,0.24)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]">
          <Trash2 className="h-6 w-6 text-[var(--danger)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--foreground)]">Supprimer cet élément&nbsp;?</h3>
        <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
          <span className="font-semibold text-[var(--foreground)]">{props.label}</span> sera définitivement supprimé.
          Cette action est irréversible.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={props.onCancel}
            className="ui-transition flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className="ui-transition ui-btn ui-btn-danger flex-1 rounded-xl py-2.5 text-sm font-semibold shadow-sm"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Section wrapper ─────────────────────────── */
function Section(props: {
  icon: typeof Users;
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const Icon = props.icon;
  return (
    <div className="ui-surface overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)]">
          <Icon className="h-5 w-5 text-[color:var(--foreground)]/50" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-[var(--foreground)]">{props.title}</h2>
          <p className="text-xs text-[color:var(--foreground)]/60">{props.subtitle}</p>
        </div>
        {props.badge && (
          <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--foreground)]/75">
            {props.badge}
          </span>
        )}
      </div>
      <div className="p-5">{props.children}</div>
    </div>
  );
}

/* ─────────────────────────── Ligne générique ─────────────────────────── */
function EntityRow(props: {
  isActive: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
  prefix?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-xl border p-2.5",
        props.isActive ? "border-[var(--line)] bg-[var(--surface)]" : "border-dashed border-[var(--line)] bg-[var(--surface-soft)] opacity-60",
      ].join(" ")}
    >
      {props.prefix}
      <input
        value={props.editValue}
        onChange={(e) => props.onEditChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && props.onSave()}
        className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--line)] focus:bg-[var(--surface-soft)]"
      />
      {props.extra}
      <button
        type="button"
        onClick={props.onSave}
        title="Enregistrer"
        className="ui-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--success)] hover:bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))]"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={props.onToggle}
        title={props.isActive ? "Désactiver" : "Activer"}
        className="ui-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/60 hover:bg-[var(--surface)]"
      >
        {props.isActive ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={props.onDelete}
        title="Supprimer"
        className="ui-transition ui-btn ui-btn-outline-danger flex h-8 w-8 shrink-0 items-center justify-center rounded-lg !p-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─────────────────────────── Page principale ─────────────────────────── */
export default function AdminSettingsPanel() {
  const { user: currentUser, reload: reloadUser } = useCurrentUser();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [admins, setAdmins] = useState<TeamMemberRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [columns, setColumns] = useState<ColumnRow[]>([]);

  // Champs "draft" (édition inline)
  const [draftAdminNames, setDraftAdminNames] = useState<Record<string, string>>({});
  const [draftCompanyNames, setDraftCompanyNames] = useState<Record<string, string>>({});
  const [draftDomainLabels, setDraftDomainLabels] = useState<Record<string, string>>({});
  const [draftDomainEmojis, setDraftDomainEmojis] = useState<Record<string, string>>({});
  const [draftColumnNames, setDraftColumnNames] = useState<Record<string, string>>({});

  // Champs "ajout"
  const [newAdminName, setNewAdminName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newDomainLabel, setNewDomainLabel] = useState("");
  const [newDomainEmoji, setNewDomainEmoji] = useState("🖥️");
  const [newColumnName, setNewColumnName] = useState("");

  // Modale de confirmation
  const [pendingDelete, setPendingDelete] = useState<{
    label: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Sélecteur "Mon profil"
  const [profileMemberId, setProfileMemberId] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState(false);

  const { branding, reload: reloadBranding } = useBranding();
  const [markUploading, setMarkUploading] = useState(false);
  const [localeSaving, setLocaleSaving] = useState(false);
  const [draftSocialThematics, setDraftSocialThematics] = useState("");
  const [draftPrintSpecies, setDraftPrintSpecies] = useState("");
  const [taxonomiesSaving, setTaxonomiesSaving] = useState(false);

  useEffect(() => {
    setDraftSocialThematics(branding.socialThematics.join("\n"));
    setDraftPrintSpecies(
      branding.printSpecies.map((item) => `${item.value}|${item.label}`).join("\n"),
    );
  }, [branding.printSpecies, branding.socialThematics]);

  /* ─── Chargement ─── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [adminsRes, companiesRes, domainsRes, columnsRes] = await Promise.all([
      supabase.from("team_members").select("id, display_name, is_active, sort_order, avatar_url").order("sort_order"),
      supabase.from("companies").select("id, name, is_active, sort_order, logo_url").order("sort_order"),
      supabase.from("domains").select("id, name, color, is_active, sort_order").order("sort_order"),
      supabase.from("workflow_columns").select("id, name, is_active, sort_order").order("sort_order"),
    ]);

    const errors: string[] = [];
    if (adminsRes.error) errors.push(`Collaborateurs: ${adminsRes.error.message}`);
    if (companiesRes.error) errors.push(`Sociétés: ${companiesRes.error.message}`);
    if (domainsRes.error) errors.push(`Domaines: ${domainsRes.error.message}`);
    if (columnsRes.error) errors.push(`Colonnes: ${columnsRes.error.message}`);
    setLoadErrors(errors);
    if (errors.length > 0) toastError("Chargement partiel. Vérifiez les droits Supabase.");

    const nextAdmins = (adminsRes.data ?? []) as TeamMemberRow[];
    const nextCompanies = (companiesRes.data ?? []) as CompanyRow[];
    const nextDomains = (domainsRes.data ?? []) as DomainRow[];
    const nextColumns = (columnsRes.data ?? []) as ColumnRow[];

    setAdmins(nextAdmins);
    setCompanies(nextCompanies);
    setDomains(nextDomains);
    setColumns(nextColumns);
    setDraftAdminNames(Object.fromEntries(nextAdmins.map((r) => [r.id, r.display_name])));
    setDraftCompanyNames(Object.fromEntries(nextCompanies.map((r) => [r.id, r.name])));
    setDraftDomainLabels(Object.fromEntries(nextDomains.map((r) => [r.id, splitDomainName(r.name).label])));
    setDraftDomainEmojis(Object.fromEntries(nextDomains.map((r) => [r.id, splitDomainName(r.name).emoji])));
    setDraftColumnNames(Object.fromEntries(nextColumns.map((r) => [r.id, r.name])));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAll]);

  useLayoutEffect(() => {
    const names = admins.map((r) => r.display_name.trim()).filter(Boolean);
    syncAdminColorAssignments(names, getAdminColorPaletteSize());
  }, [admins]);

  /* ─── Sort order ─── */
  const updateSortOrder = async (
    table: "workflow_columns" | "team_members" | "companies" | "domains",
    rows: Array<{ id: string }>,
  ) => {
    const results = await Promise.all(
      rows.map((row, idx) => supabase.from(table).update({ sort_order: idx }).eq("id", row.id)),
    );
    if (results.some((r) => r.error)) { toastError("Impossible de mettre à jour l'ordre."); return false; }
    return true;
  };

  /* ─── Profil utilisateur ─── */
  const saveProfile = async () => {
    const resolvedProfileMemberId = profileMemberId || currentUser?.teamMemberId || "";
    if (!currentUser || !resolvedProfileMemberId) return;
    setSavingProfile(true);
    const member = admins.find((a) => a.id === resolvedProfileMemberId);
    const { error } = await supabase
      .from("profiles")
      .update({ team_member_id: resolvedProfileMemberId, display_name: member?.display_name ?? null })
      .eq("id", currentUser.id);
    if (error) { toastError("Impossible de mettre à jour votre profil."); setSavingProfile(false); return; }
    reloadUser();
    toastSuccess("Profil mis à jour !");
    setSavingProfile(false);
  };

  /* ─── Stats ─── */
  const stats = useMemo(() => ({
    admins: admins.filter((r) => r.is_active).length,
    companies: companies.filter((r) => r.is_active).length,
    domains: domains.filter((r) => r.is_active).length,
    columns: columns.filter((r) => r.is_active).length,
  }), [admins, companies, domains, columns]);

  /* ─── Helper : demander confirmation avant delete ─── */
  const askDelete = (label: string, onConfirm: () => Promise<void>) => {
    setPendingDelete({ label, onConfirm });
  };

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <>
      {pendingDelete && (
        <ConfirmDeleteModal
          label={pendingDelete.label}
          onConfirm={async () => {
            await pendingDelete.onConfirm();
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <section className="space-y-4">
        {/* ─── En-tête ─── */}
        <div className="ui-surface flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground)]/50">
              Administration
            </p>
            <h1 className="ui-heading mt-0.5 text-3xl font-semibold text-[var(--foreground)]">
              Paramètres
            </h1>
            <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
              {loading
                ? "Chargement..."
                : `${stats.admins} collaborateurs · ${stats.companies} sociétés · ${stats.domains} domaines · ${stats.columns} colonnes`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="ui-transition flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface)] disabled:opacity-40"
          >
            <RefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")} />
            Rafraîchir
          </button>
        </div>

        {loadErrors.length > 0 && (
          <div className="ui-alert ui-alert-warning flex items-start gap-2 rounded-2xl px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
            <div className="space-y-0.5">
              {loadErrors.map((msg) => (
                <p key={msg} className="text-sm">{msg}</p>
              ))}
            </div>
          </div>
        )}

        {/* ─── Facturation ─── */}
        <Section
          icon={CreditCard}
          title="Facturation"
          subtitle="Gérez votre essai gratuit et votre abonnement Stripe."
        >
          <BillingCard />
        </Section>

        {/* ─── Agenda Outlook 365 ─── */}
        <Section
          icon={CalendarClock}
          title="Agenda Outlook 365"
          subtitle="Synchronisez vos tâches planifiées vers votre agenda Microsoft Outlook."
        >
          <OutlookConnectionCard />
        </Section>

        {/* ─── Pictogramme / marque ─── */}
        <Section
          icon={ImageIcon}
          title="Identité visuelle"
          subtitle={`Pictogramme affiché dans la barre latérale et sur la page de connexion (${branding.appName}).`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
              {branding.markUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- pictogramme personnalisé uploadé
                <img
                  src={branding.markUrl}
                  alt={`Pictogramme ${branding.appName}`}
                  className="h-16 w-16 object-contain"
                />
              ) : (
                <AppMark className="h-16 w-16" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm text-[color:var(--foreground)]/70">
                Par défaut, un pictogramme neutre est utilisé. Vous pouvez envoyer une image personnalisée (PNG,
                WebP, JPG ou SVG), ou définir{" "}
                <code className="rounded bg-[var(--surface-soft)] px-1 text-xs">NEXT_PUBLIC_APP_MARK_SRC</code>{" "}
                dans l&apos;environnement.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="ui-transition inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/80 hover:bg-[var(--surface)]">
                  <ImageIcon className="h-4 w-4" />
                  {markUploading ? "Envoi…" : "Choisir une image"}
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/gif,image/svg+xml"
                    className="sr-only"
                    disabled={markUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
                      const allowed = ["png", "webp", "jpg", "jpeg", "gif", "svg"];
                      if (!allowed.includes(ext)) {
                        toastError("Utilisez PNG, WebP, JPG, GIF ou SVG.");
                        e.target.value = "";
                        return;
                      }
                      setMarkUploading(true);
                      const relativePath = `app-mark-${Date.now()}.${ext}`;
                      const formData = new FormData();
                      formData.set("file", file);
                      const upload = await uploadOrgAsset(formData, APP_MARK_STORAGE_BUCKET, relativePath);
                      if (!upload.ok) {
                        toastError(`Envoi impossible : ${upload.error}`);
                        setMarkUploading(false);
                        e.target.value = "";
                        return;
                      }
                      const result = await updateBranding({ markUrl: upload.path });
                      if (!result.ok) {
                        toastError(`Enregistrement impossible : ${result.error}`);
                        setMarkUploading(false);
                        e.target.value = "";
                        return;
                      }
                      await reloadBranding();
                      toastSuccess("Pictogramme mis à jour.");
                      setMarkUploading(false);
                      e.target.value = "";
                    }}
                  />
                </label>
                {branding.markUrl ? (
                  <button
                    type="button"
                    disabled={markUploading}
                    onClick={async () => {
                      setMarkUploading(true);
                      const result = await updateBranding({ markUrl: null });
                      if (!result.ok) {
                        toastError(`Réinitialisation impossible : ${result.error}`);
                        setMarkUploading(false);
                        return;
                      }
                      await reloadBranding();
                      toastSuccess("Pictogramme réinitialisé.");
                      setMarkUploading(false);
                    }}
                    className="ui-transition rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)] disabled:opacity-50"
                  >
                    Réinitialiser
                  </button>
                ) : null}
              </div>
              <div className="border-t border-[var(--line)] pt-4">
                <label htmlFor="app-locale" className="mb-1.5 block text-sm font-semibold">
                  Langue de l&apos;interface
                </label>
                <p className="mb-2 text-xs text-[color:var(--foreground)]/55">
                  Français ou anglais pour la connexion, l&apos;installation et les écrans traduits.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    id="app-locale"
                    value={resolveLocale(branding.locale)}
                    disabled={localeSaving}
                    onChange={async (e) => {
                      const next = resolveLocale(e.target.value) as AppLocale;
                      setLocaleSaving(true);
                      const result = await updateBranding({ locale: next });
                      if (!result.ok) {
                        toastError(result.error);
                        setLocaleSaving(false);
                        return;
                      }
                      await reloadBranding();
                      toastSuccess("Langue enregistrée.");
                      setLocaleSaving(false);
                    }}
                    className="ui-input max-w-xs"
                  >
                    {LOCALE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── Taxonomies métier ─── */}
        <Section
          icon={Layers}
          title="Taxonomies"
          subtitle="Thématiques des posts réseaux sociaux et catégories du stock print."
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="social-thematics" className="mb-1.5 block text-sm font-semibold">
                Thématiques social (une par ligne)
              </label>
              <textarea
                id="social-thematics"
                value={draftSocialThematics}
                onChange={(e) => setDraftSocialThematics(e.target.value)}
                rows={6}
                className="ui-input w-full font-mono text-sm"
                placeholder={"Événement\nMarque\nProduit"}
              />
            </div>
            <div>
              <label htmlFor="print-species" className="mb-1.5 block text-sm font-semibold">
                Catégories print (format : code|libellé, une par ligne)
              </label>
              <textarea
                id="print-species"
                value={draftPrintSpecies}
                onChange={(e) => setDraftPrintSpecies(e.target.value)}
                rows={5}
                className="ui-input w-full font-mono text-sm"
                placeholder={"general|Général\ncatalogue|Catalogues"}
              />
            </div>
            <button
              type="button"
              disabled={taxonomiesSaving}
              onClick={async () => {
                setTaxonomiesSaving(true);
                const socialThematics = parseSocialThematics(
                  draftSocialThematics.split("\n").map((line) => line.trim()).filter(Boolean),
                );
                const printSpecies = parsePrintSpecies(
                  draftPrintSpecies
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [value, ...rest] = line.split("|");
                      const label = rest.join("|").trim() || value.trim();
                      return {
                        value: value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                        label,
                      };
                    })
                    .filter((item) => item.value),
                );
                const result = await updateBranding({ socialThematics, printSpecies });
                if (!result.ok) {
                  toastError(result.error);
                  setTaxonomiesSaving(false);
                  return;
                }
                await reloadBranding();
                toastSuccess("Taxonomies enregistrées.");
                setTaxonomiesSaving(false);
              }}
              className="ui-transition rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {taxonomiesSaving ? "Enregistrement…" : "Enregistrer les taxonomies"}
            </button>
          </div>
        </Section>

        {/* ─── Mon profil ─── */}
        <Section
          icon={UserCircle2}
          title="Mon profil"
          subtitle="Lier votre compte à un membre de l'équipe pour personnaliser votre expérience."
        >
          {currentUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                {currentUser.teamMemberName && (
                  <AdminAvatar admin={currentUser.teamMemberName as AdminId} size="md" />
                )}
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {currentUser.teamMemberName ?? currentUser.displayName ?? "Profil non configuré"}
                  </p>
                  <p className="text-xs text-[color:var(--foreground)]/55">{currentUser.email}</p>
                </div>
                {currentUser.teamMemberName && (
                  <span
                    className="ml-auto h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        adminSolidColorFor(currentUser.teamMemberName ?? ""),
                    }}
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/55">
                  Changer mon identité
                </label>
                <div className="flex gap-2">
                  <select
                    value={profileMemberId || currentUser?.teamMemberId || ""}
                    onChange={(e) => setProfileMemberId(e.target.value)}
                    className="ui-focus-ring flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
                  >
                    <option value="">— Sélectionnez un profil —</option>
                    {admins.filter((a) => a.is_active).map((a) => (
                      <option key={a.id} value={a.id}>{a.display_name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={!(profileMemberId || currentUser?.teamMemberId) || savingProfile}
                    className="ui-transition rounded-xl bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50"
                  >
                    {savingProfile ? "..." : "Enregistrer"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--foreground)]/50">Connexion requise.</p>
          )}
        </Section>

        {/* ─── Collaborateurs ─── */}
        <Section
          icon={Users}
          title="Collaborateurs"
          subtitle="Membres de l'équipe disponibles dans le formulaire de création de tâche."
          badge={`${stats.admins} actifs`}
        >
          {/* Ajout */}
          <div className="mb-4 flex gap-2">
            <input
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const name = newAdminName.trim();
                  if (!name) return;
                  void (async () => {
                    const { error } = await supabase.from("team_members").insert({ display_name: name, is_active: true });
                    if (error) { toastError(`Ajout impossible: ${error.message}`); return; }
                    setNewAdminName("");
                    await loadAll();
                    toastSuccess("Collaborateur ajouté.");
                  })();
                }
              }}
              placeholder="Prénom Nom du collaborateur"
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={async () => {
                const name = newAdminName.trim();
                if (!name) return;
                const { error } = await supabase.from("team_members").insert({ display_name: name, is_active: true });
                if (error) { toastError(`Ajout impossible: ${error.message}`); return; }
                setNewAdminName("");
                await loadAll();
                toastSuccess("Collaborateur ajouté.");
              }}
              className="ui-transition flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {admins.map((row) => {
              const color = adminSolidColorFor(row.display_name);
              return (
                <EntityRow
                  key={row.id}
                  isActive={row.is_active}
                  editValue={draftAdminNames[row.id] ?? row.display_name}
                  onEditChange={(v) => setDraftAdminNames((p) => ({ ...p, [row.id]: v }))}
                  onSave={async () => {
                    const nextName = (draftAdminNames[row.id] ?? "").trim();
                    if (!nextName) return;
                    const { error } = await supabase.from("team_members").update({ display_name: nextName }).eq("id", row.id);
                    if (error) { toastError("Modification impossible."); return; }
                    await loadAll();
                    toastSuccess("Collaborateur mis à jour.");
                  }}
                  onToggle={async () => {
                    const { error } = await supabase.from("team_members").update({ is_active: !row.is_active }).eq("id", row.id);
                    if (error) { toastError("Mise à jour impossible."); return; }
                    await loadAll();
                    toastSuccess(row.is_active ? "Désactivé." : "Activé.");
                  }}
                  onDelete={() =>
                    askDelete(row.display_name, async () => {
                      const { error } = await supabase.from("team_members").delete().eq("id", row.id);
                      if (error) { toastError(`Suppression impossible: ${error.message}`); return; }
                      await loadAll();
                      toastSuccess("Collaborateur supprimé.");
                    })
                  }
                  prefix={
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Avatar avec upload */}
                      <label className="relative cursor-pointer group" title="Changer la photo">
                        <AdminAvatar admin={row.display_name as AdminId} size="md" avatarUrl={row.avatar_url ?? null} />
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <ImageIcon className="h-3 w-3 text-white" />
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const ext = file.name.split(".").pop() ?? "jpg";
                            const relativePath = `${row.id}.${ext}`;
                            const formData = new FormData();
                            formData.set("file", file);
                            const upload = await uploadOrgAsset(formData, "member-avatars", relativePath);
                            if (!upload.ok) {
                              toastError(`Upload impossible: ${upload.error}`);
                              return;
                            }
                            const { error: dbErr } = await supabase
                              .from("team_members")
                              .update({ avatar_url: upload.path })
                              .eq("id", row.id);
                            if (dbErr) { toastError("Impossible de sauvegarder l'avatar."); return; }
                            await loadAll();
                            toastSuccess("Photo mise à jour !");
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {color && (
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={`Couleur : ${color}`}
                        />
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-[color:var(--foreground)]/45">
            Les couleurs sont assignées automatiquement par l&apos;application selon l&apos;ordre des collaborateurs.
          </p>
        </Section>

        {/* ─── Sociétés ─── */}
        <Section
          icon={Building2}
          title="Sociétés / Filiales"
          subtitle="Liste alimentant le menu déroulant du formulaire de création de tâche."
          badge={`${stats.companies} actives`}
        >
          <div className="mb-4 flex gap-2">
            <input
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const name = newCompanyName.trim();
                if (!name) return;
                void (async () => {
                  const { error } = await supabase.from("companies").insert({ name, is_active: true });
                  if (error) { toastError(`Ajout impossible: ${error.message}`); return; }
                  setNewCompanyName("");
                  await loadAll();
                  toastSuccess("Société ajoutée.");
                })();
              }}
              placeholder="Nom de la société"
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={async () => {
                const name = newCompanyName.trim();
                if (!name) return;
                const { error } = await supabase.from("companies").insert({ name, is_active: true });
                if (error) { toastError(`Ajout impossible: ${error.message}`); return; }
                setNewCompanyName("");
                await loadAll();
                toastSuccess("Société ajoutée.");
              }}
              className="ui-transition flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {companies.map((row) => (
              <div key={row.id} className="space-y-1.5">
                {/* Logo upload + miniature */}
                <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2">
                  <CompanyAvatar
                    name={row.name}
                    logoUrl={row.logo_url}
                    className="h-8 w-8 rounded-md border border-[var(--line)] bg-white object-contain"
                    fallbackClassName="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/35"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--foreground)] truncate">{row.name}</p>
                    <p className="text-[10px] text-[color:var(--foreground)]/50">Logo de la société</p>
                  </div>
                  <label className="ui-transition cursor-pointer flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {row.logo_url ? "Changer" : "Ajouter"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ext = file.name.split(".").pop() ?? "png";
                        const relativePath = `${row.id}.${ext}`;
                        const formData = new FormData();
                        formData.set("file", file);
                        const upload = await uploadOrgAsset(formData, "company-logos", relativePath);
                        if (!upload.ok) {
                          toastError(`Upload impossible: ${upload.error}`);
                          return;
                        }
                        const { error: dbErr } = await supabase
                          .from("companies")
                          .update({ logo_url: upload.path })
                          .eq("id", row.id);
                        if (dbErr) { toastError("Mise à jour impossible."); return; }
                        await loadAll();
                        toastSuccess("Logo mis à jour.");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {row.logo_url && (
                    <button
                      type="button"
                      title="Supprimer le logo"
                      onClick={async () => {
                        const { error } = await supabase.from("companies").update({ logo_url: null }).eq("id", row.id);
                        if (error) { toastError("Impossible de supprimer le logo."); return; }
                        await loadAll();
                        toastSuccess("Logo supprimé.");
                      }}
                      className="ui-transition ui-btn ui-btn-outline-danger flex h-7 w-7 items-center justify-center rounded-lg !p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <EntityRow
                  isActive={row.is_active}
                  editValue={draftCompanyNames[row.id] ?? row.name}
                  onEditChange={(v) => setDraftCompanyNames((p) => ({ ...p, [row.id]: v }))}
                  onSave={async () => {
                    const nextName = (draftCompanyNames[row.id] ?? "").trim();
                    if (!nextName) return;
                    const { error } = await supabase.from("companies").update({ name: nextName }).eq("id", row.id);
                    if (error) { toastError("Modification impossible."); return; }
                    await loadAll();
                    toastSuccess("Société mise à jour.");
                  }}
                  onToggle={async () => {
                    const { error } = await supabase.from("companies").update({ is_active: !row.is_active }).eq("id", row.id);
                    if (error) { toastError("Mise à jour impossible."); return; }
                    await loadAll();
                    toastSuccess(row.is_active ? "Désactivée." : "Activée.");
                  }}
                  onDelete={() =>
                    askDelete(row.name, async () => {
                      const { error } = await supabase.from("companies").delete().eq("id", row.id);
                      if (error) { toastError(`Suppression impossible: ${error.message}`); return; }
                      await loadAll();
                      toastSuccess("Société supprimée.");
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Section>

        {/* ─── Domaines ─── */}
        <Section
          icon={Layers}
          title="Domaines d'action"
          subtitle="Pôles / familles de tâches (Print, Digital, Event…)."
          badge={`${stats.domains} actifs`}
        >
          {/* Ajout */}
          <div className="mb-4 grid gap-2 sm:grid-cols-[80px_1fr_auto]">
            <input
              value={newDomainEmoji}
              onChange={(e) => setNewDomainEmoji(e.target.value)}
              placeholder="🖥️"
              className="ui-focus-ring rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-center text-sm"
            />
            <input
              value={newDomainLabel}
              onChange={(e) => setNewDomainLabel(e.target.value)}
              placeholder="Nom du domaine"
              className="ui-focus-ring rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={async () => {
                const label = newDomainLabel.trim();
                if (!label) return;
                const name = `${newDomainEmoji.trim()} ${label}`.trim();
                const { error } = await supabase
                  .from("domains")
                  .insert({ name, color: branding.primaryColor, is_active: true });
                if (error) { toastError(`Ajout impossible: ${error.message}`); return; }
                setNewDomainLabel("");
                await loadAll();
                toastSuccess("Domaine ajouté.");
              }}
              className="ui-transition flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {domains.map((row) => (
              <EntityRow
                key={row.id}
                isActive={row.is_active}
                editValue={`${draftDomainEmojis[row.id] ?? ""} ${draftDomainLabels[row.id] ?? ""}`.trim()}
                onEditChange={(v) => {
                  const match = v.match(/^(\p{Extended_Pictographic}(?:\uFE0F)?)\s*(.*)?$/u);
                  if (match) {
                    setDraftDomainEmojis((p) => ({ ...p, [row.id]: match[1] ?? "" }));
                    setDraftDomainLabels((p) => ({ ...p, [row.id]: (match[2] ?? "").trim() }));
                  } else {
                    setDraftDomainLabels((p) => ({ ...p, [row.id]: v.trim() }));
                  }
                }}
                onSave={async () => {
                  const label = (draftDomainLabels[row.id] ?? "").trim();
                  if (!label) return;
                  const emoji = (draftDomainEmojis[row.id] ?? "").trim();
                  const name = `${emoji} ${label}`.trim();
                  const { error } = await supabase
                    .from("domains")
                    .update({ name, color: branding.primaryColor })
                    .eq("id", row.id);
                  if (error) { toastError("Modification impossible."); return; }
                  await loadAll();
                  toastSuccess("Domaine mis à jour.");
                }}
                onToggle={async () => {
                  const { error } = await supabase.from("domains").update({ is_active: !row.is_active }).eq("id", row.id);
                  if (error) { toastError("Mise à jour impossible."); return; }
                  await loadAll();
                  toastSuccess(row.is_active ? "Désactivé." : "Activé.");
                }}
                onDelete={() =>
                  askDelete(row.name, async () => {
                    const { error } = await supabase.from("domains").delete().eq("id", row.id);
                    if (error) { toastError(`Suppression impossible: ${error.message}`); return; }
                    await loadAll();
                    toastSuccess("Domaine supprimé.");
                  })
                }
              />
            ))}
          </div>
        </Section>

        {/* ─── Colonnes ─── */}
        <Section
          icon={PenLine}
          title="Colonnes / Statuts"
          subtitle="Ordre d'affichage de gauche à droite dans le Kanban."
          badge={`${stats.columns} actives`}
        >
          <div className="mb-4 flex gap-2">
            <input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Nom de la nouvelle colonne"
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={async () => {
                const name = newColumnName.trim();
                if (!name) return;
                const { error } = await supabase.from("workflow_columns").insert({ name, is_active: true });
                if (error) { toastError(`Ajout impossible: ${error.message}`); return; }
                setNewColumnName("");
                await loadAll();
                toastSuccess("Colonne ajoutée.");
              }}
              className="ui-transition flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {columns.map((row, index) => (
              <div
                key={row.id}
                className={[
                  "flex items-center gap-2 rounded-xl border p-2.5",
                  row.is_active
                    ? "border-[var(--line)] bg-[var(--surface)]"
                    : "border-dashed border-[var(--line)] bg-[var(--surface-soft)] opacity-60",
                ].join(" ")}
              >
                {/* Badge numéro */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--surface-soft)] text-[11px] font-bold text-[color:var(--foreground)]/50">
                  {index + 1}
                </span>

                <input
                  value={draftColumnNames[row.id] ?? row.name}
                  onChange={(e) => setDraftColumnNames((p) => ({ ...p, [row.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const nextName = (draftColumnNames[row.id] ?? "").trim();
                    if (!nextName) return;
                    void (async () => {
                      const { error } = await supabase.from("workflow_columns").update({ name: nextName }).eq("id", row.id);
                      if (error) { toastError("Renommage impossible."); return; }
                      await loadAll();
                      toastSuccess("Colonne renommée.");
                    })();
                  }}
                  className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--line)] focus:bg-[var(--surface-soft)]"
                />

                {/* Sauvegarder */}
                <button type="button" title="Enregistrer"
                  onClick={async () => {
                    const nextName = (draftColumnNames[row.id] ?? "").trim();
                    if (!nextName) return;
                    const { error } = await supabase.from("workflow_columns").update({ name: nextName }).eq("id", row.id);
                    if (error) { toastError("Renommage impossible."); return; }
                    await loadAll();
                    toastSuccess("Colonne renommée.");
                  }}
                  className="ui-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--success)] hover:bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))]"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>

                {/* Monter */}
                <button type="button" title="Monter" disabled={index === 0}
                  onClick={async () => {
                    const reordered = [...columns];
                    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
                    const ok = await updateSortOrder("workflow_columns", reordered);
                    if (ok) { await loadAll(); toastSuccess("Ordre mis à jour."); }
                  }}
                  className="ui-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>

                {/* Descendre */}
                <button type="button" title="Descendre" disabled={index === columns.length - 1}
                  onClick={async () => {
                    const reordered = [...columns];
                    [reordered[index + 1], reordered[index]] = [reordered[index], reordered[index + 1]];
                    const ok = await updateSortOrder("workflow_columns", reordered);
                    if (ok) { await loadAll(); toastSuccess("Ordre mis à jour."); }
                  }}
                  className="ui-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] hover:bg-[var(--surface)] disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {/* Activer/Désactiver */}
                <button type="button" title={row.is_active ? "Désactiver" : "Activer"}
                  onClick={async () => {
                    const { error } = await supabase.from("workflow_columns").update({ is_active: !row.is_active }).eq("id", row.id);
                    if (error) { toastError("Mise à jour impossible."); return; }
                    await loadAll();
                    toastSuccess(row.is_active ? "Désactivée." : "Activée.");
                  }}
                  className="ui-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/60 hover:bg-[var(--surface)]"
                >
                  {row.is_active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-[var(--success)]" />}
                </button>

                {/* Supprimer */}
                <button type="button" title="Supprimer"
                  onClick={() =>
                    askDelete(row.name, async () => {
                      const { error } = await supabase.from("workflow_columns").delete().eq("id", row.id);
                      if (error) { toastError(`Suppression impossible: ${error.message}`); return; }
                      await loadAll();
                      toastSuccess("Colonne supprimée.");
                    })
                  }
                  className="ui-transition ui-btn ui-btn-outline-danger flex h-8 w-8 shrink-0 items-center justify-center rounded-lg !p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── Archivage ─── */}
        <Section
          icon={Archive}
          title="Archivage automatique"
          subtitle="Les tâches passées en 'Terminé' depuis plus de 24h sont automatiquement archivées."
        >
          <div className="ui-alert ui-alert-success flex items-center gap-3 rounded-xl px-4 py-3">
            <span className="text-lg">✅</span>
            <p className="text-sm">
              <strong>Délai fixe : 24 heures.</strong> Toute tâche dans la colonne &quot;Terminé&quot; depuis plus d&apos;un jour est automatiquement déplacée dans les Archives. Ce comportement n&apos;est pas configurable.
            </p>
          </div>
        </Section>
      </section>
    </>
  );
}
