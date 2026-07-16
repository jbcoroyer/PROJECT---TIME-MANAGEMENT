"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarClock,
  Globe,
  ImageIcon,
  UserCircle2,
} from "lucide-react";
import AdminAvatar from "../AdminAvatar";
import OutlookConnectionCard from "../OutlookConnectionCard";
import { AppMark } from "../AppBrand";
import { useBranding } from "../../lib/brandingContext";
import { updateBranding } from "../../app/actions/branding";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { adminSolidColorFor } from "../../lib/kanbanStyles";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { toastError, toastSuccess } from "../../lib/toast";
import { resolveLocale } from "../../lib/i18n";
import { writeStoredLocale } from "../../lib/i18n/localeStorage";
import { useTranslation } from "../../lib/i18n/useTranslation";
import LocalePicker from "../i18n/LocalePicker";
import { APP_MARK_STORAGE_BUCKET } from "../../lib/storageBuckets";
import { uploadOrgAsset } from "../../app/actions/storage";
import { SettingsSection } from "./settingsShared";

type TeamMemberRow = {
  id: string;
  display_name: string;
  is_active: boolean;
};

export default function AdminSettingsPanel() {
  const { user: currentUser, reload: reloadUser } = useCurrentUser();
  const { t } = useTranslation();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const { branding, reload: reloadBranding } = useBranding();

  const [admins, setAdmins] = useState<TeamMemberRow[]>([]);
  const [profileMemberId, setProfileMemberId] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [markUploading, setMarkUploading] = useState(false);
  const [localeSaving, setLocaleSaving] = useState(false);

  const loadAdmins = useCallback(async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("id, display_name, is_active")
      .order("sort_order");
    if (error) {
      toastError(t("settings.profileLoadError", { message: error.message }));
      return;
    }
    setAdmins((data ?? []) as TeamMemberRow[]);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAdmins();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAdmins]);

  async function saveProfile() {
    const resolvedProfileMemberId = profileMemberId || currentUser?.teamMemberId || "";
    if (!currentUser || !resolvedProfileMemberId) return;
    setSavingProfile(true);
    const member = admins.find((a) => a.id === resolvedProfileMemberId);
    const { error } = await supabase
      .from("profiles")
      .update({ team_member_id: resolvedProfileMemberId, display_name: member?.display_name ?? null })
      .eq("id", currentUser.id);
    if (error) {
      toastError(t("settings.profileUpdateError"));
      setSavingProfile(false);
      return;
    }
    reloadUser();
    toastSuccess(t("settings.profileUpdated"));
    setSavingProfile(false);
  }

  return (
    <section id="settings-organisation" className="scroll-mt-24 space-y-4">
      <SettingsSection
        id="settings-outlook"
        icon={CalendarClock}
        title={t("settings.outlookTitle")}
        subtitle={t("settings.outlookSubtitle")}
      >
        <OutlookConnectionCard />
      </SettingsSection>

      <SettingsSection
        icon={Globe}
        title={t("settings.locale")}
        subtitle={t("settings.localeHint")}
      >
        <LocalePicker
          id="app-locale"
          value={resolveLocale(branding.locale)}
          disabled={localeSaving}
          onChange={async (next) => {
            setLocaleSaving(true);
            const result = await updateBranding({ locale: next });
            if (!result.ok) {
              toastError(result.error);
              setLocaleSaving(false);
              return;
            }
            writeStoredLocale(next);
            await reloadBranding();
            toastSuccess(t("settings.localeSaved"));
            setLocaleSaving(false);
          }}
        />
      </SettingsSection>

      <SettingsSection
        icon={ImageIcon}
        title={t("settings.brandingTitle")}
        subtitle={t("settings.brandingSubtitle", { name: branding.appName })}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
            {branding.markUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- pictogramme personnalisé uploadé
              <img
                src={branding.markUrl}
                alt={`Logo ${branding.appName}`}
                className="h-16 w-16 object-contain"
              />
            ) : (
              <AppMark className="h-16 w-16" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm text-[color:var(--foreground)]/70">{t("settings.brandingDefaultHint")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="ui-transition inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/80 hover:bg-[var(--surface)]">
                <ImageIcon className="h-4 w-4" />
                {markUploading ? t("settings.brandingUploading") : t("settings.brandingChooseImage")}
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
                      toastError(t("settings.brandingInvalidFormat"));
                      e.target.value = "";
                      return;
                    }
                    setMarkUploading(true);
                    const relativePath = `app-mark-${Date.now()}.${ext}`;
                    const formData = new FormData();
                    formData.set("file", file);
                    const upload = await uploadOrgAsset(formData, APP_MARK_STORAGE_BUCKET, relativePath);
                    if (!upload.ok) {
                      toastError(t("settings.brandingUploadError", { error: upload.error }));
                      setMarkUploading(false);
                      e.target.value = "";
                      return;
                    }
                    const result = await updateBranding({ markUrl: upload.path });
                    if (!result.ok) {
                      toastError(t("settings.brandingSaveError", { error: result.error }));
                      setMarkUploading(false);
                      e.target.value = "";
                      return;
                    }
                    await reloadBranding();
                    toastSuccess(t("settings.brandingUpdated"));
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
                      toastError(t("settings.brandingResetError", { error: result.error }));
                      setMarkUploading(false);
                      return;
                    }
                    await reloadBranding();
                    toastSuccess(t("settings.brandingResetDone"));
                    setMarkUploading(false);
                  }}
                  className="ui-transition rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)] disabled:opacity-50"
                >
                  {t("settings.brandingReset")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={UserCircle2}
        title={t("settings.profileTitle")}
        subtitle={t("settings.profileSubtitle")}
      >
        {currentUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
              {currentUser.teamMemberName ? (
                <AdminAvatar admin={currentUser.teamMemberName} size="md" />
              ) : null}
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {currentUser.teamMemberName ?? currentUser.displayName ?? t("settings.profileNotConfigured")}
                </p>
                <p className="text-xs text-[color:var(--foreground)]/55">{currentUser.email}</p>
              </div>
              {currentUser.teamMemberName ? (
                <span
                  className="ml-auto h-3 w-3 rounded-full"
                  style={{ backgroundColor: adminSolidColorFor(currentUser.teamMemberName ?? "") }}
                />
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/55">
                Changer mon profil équipe
              </label>
              <div className="flex gap-2">
                <select
                  value={profileMemberId || currentUser.teamMemberId || ""}
                  onChange={(e) => setProfileMemberId(e.target.value)}
                  className="ui-focus-ring flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
                >
                  <option value="">— Sélectionnez un profil —</option>
                  {admins.filter((a) => a.is_active).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.display_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={!(profileMemberId || currentUser.teamMemberId) || savingProfile}
                  className="ui-transition rounded-xl bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50"
                >
                  {savingProfile ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[color:var(--foreground)]/50">Connexion requise.</p>
        )}
      </SettingsSection>

      <SettingsSection
        icon={Archive}
        title="Archivage automatique"
        subtitle="Les tâches passées en « Terminé » depuis plus de 24 h sont automatiquement archivées."
      >
        <div className="ui-alert ui-alert-success flex items-center gap-3 rounded-xl px-4 py-3">
          <span className="text-lg">✅</span>
          <p className="text-sm">
            <strong>Délai fixe : 24 heures.</strong> Toute tâche dans la colonne « Terminé » depuis plus
            d&apos;un jour est automatiquement déplacée dans les Archives. Ce comportement n&apos;est pas
            configurable.
          </p>
        </div>
      </SettingsSection>
    </section>
  );
}
