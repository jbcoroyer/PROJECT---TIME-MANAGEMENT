"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ImageIcon, Mail, Plus, RefreshCw, UserPlus, Users } from "lucide-react";
import AdminAvatar from "../AdminAvatar";
import { inviteTeamMember } from "../../app/actions/invites";
import { uploadOrgAsset } from "../../app/actions/storage";
import { syncAdminColorAssignments } from "../../lib/adminColorAssignments";
import { adminSolidColorFor, getAdminColorPaletteSize } from "../../lib/kanbanStyles";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { toastError, toastSuccess } from "../../lib/toast";
import { useTranslation } from "../../lib/i18n/useTranslation";
import type { AdminId } from "../../lib/types";
import { ConfirmDeleteModal, EntityRow, SettingsSection } from "./settingsShared";

type TeamMemberRow = {
  id: string;
  display_name: string;
  is_active: boolean;
  sort_order: number;
  avatar_url?: string | null;
};

export default function TeamSettingsSection() {
  const { t } = useTranslation();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [newMemberName, setNewMemberName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [inviteBusy, setInviteBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("team_members")
      .select("id, display_name, is_active, sort_order, avatar_url")
      .order("sort_order");
    if (error) {
      toastError(t("settings.team.loadError", { message: error.message }));
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as TeamMemberRow[];
    setMembers(rows);
    setDraftNames(Object.fromEntries(rows.map((r) => [r.id, r.display_name])));
    setLoading(false);
  }, [supabase, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMembers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadMembers]);

  useLayoutEffect(() => {
    const names = members.map((r) => r.display_name.trim()).filter(Boolean);
    syncAdminColorAssignments(names, getAdminColorPaletteSize());
  }, [members]);

  const activeCount = members.filter((m) => m.is_active).length;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteBusy(true);
    try {
      const result = await inviteTeamMember({ email: inviteEmail, role: inviteRole });
      if (!result.ok) throw new Error(result.error);
      toastSuccess(t("settings.team.inviteSent"));
      setInviteEmail("");
    } catch (err) {
      toastError(err instanceof Error ? err.message : t("settings.team.inviteError"));
    } finally {
      setInviteBusy(false);
    }
  }

  async function addMember(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await supabase.from("team_members").insert({ display_name: trimmed, is_active: true });
    if (error) {
      toastError(t("settings.team.addError", { message: error.message }));
      return;
    }
    setNewMemberName("");
    await loadMembers();
    toastSuccess(t("settings.team.memberAdded"));
  }

  return (
    <>
      {pendingDelete ? (
        <ConfirmDeleteModal
          label={pendingDelete.label}
          onConfirm={async () => {
            await pendingDelete.onConfirm();
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}

      <section id="settings-team" className="scroll-mt-24 space-y-4">
        <div className="ui-surface overflow-hidden rounded-2xl border border-[color:var(--brand-primary)]/20 bg-gradient-to-br from-[color:var(--brand-primary)]/8 via-[var(--surface)] to-[var(--surface)]">
          <div className="border-b border-[var(--line)] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                  {t("settings.team.kicker")}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                  {t("settings.team.inviteTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--foreground)]/65">
                  {t("settings.team.inviteBody")}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-center">
                <p className="text-2xl font-bold text-[var(--foreground)]">{activeCount}</p>
                <p className="text-xs text-[color:var(--foreground)]/55">{t("settings.team.activeCount")}</p>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => void handleInvite(e)} className="space-y-4 px-5 py-5 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div>
                <label htmlFor="team-invite-email" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  {t("settings.team.emailLabel")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground)]/35" />
                  <input
                    id="team-invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t("settings.team.emailPlaceholder")}
                    className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="team-invite-role" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  {t("settings.team.roleLabel")}
                </label>
                <select
                  id="team-invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
                  className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm sm:min-w-[10rem]"
                >
                  <option value="user">{t("settings.team.roleUser")}</option>
                  <option value="admin">{t("settings.team.roleAdmin")}</option>
                </select>
              </div>
              <button type="submit" disabled={inviteBusy} className="ui-btn ui-btn-primary gap-2 px-5 py-2.5 text-sm">
                <UserPlus className="h-4 w-4" />
                {inviteBusy ? t("settings.team.inviting") : t("settings.team.invite")}
              </button>
            </div>
          </form>
        </div>

        <SettingsSection
          icon={Users}
          title={t("settings.team.membersTitle")}
          subtitle={t("settings.team.membersSubtitle")}
          badge={loading ? "…" : `${activeCount} ${t("settings.team.activeCount")}`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[color:var(--foreground)]/60">{t("settings.team.membersHint")}</p>
            <button
              type="button"
              onClick={() => void loadMembers()}
              disabled={loading}
              className="ui-transition inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)] disabled:opacity-40"
            >
              <RefreshCw className={["h-3.5 w-3.5", loading ? "animate-spin" : ""].join(" ")} />
              {t("common.refresh")}
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addMember(newMemberName);
              }}
              placeholder={t("settings.team.namePlaceholder")}
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void addMember(newMemberName)}
              className="ui-transition flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface)]"
            >
              <Plus className="h-4 w-4" />
              {t("settings.team.add")}
            </button>
          </div>

          <div className="space-y-2">
            {members.map((row) => {
              const color = adminSolidColorFor(row.display_name);
              return (
                <EntityRow
                  key={row.id}
                  isActive={row.is_active}
                  editValue={draftNames[row.id] ?? row.display_name}
                  onEditChange={(v) => setDraftNames((p) => ({ ...p, [row.id]: v }))}
                  onSave={async () => {
                    const nextName = (draftNames[row.id] ?? "").trim();
                    if (!nextName) return;
                    const { error } = await supabase
                      .from("team_members")
                      .update({ display_name: nextName })
                      .eq("id", row.id);
                    if (error) {
                      toastError(t("settings.team.updateError"));
                      return;
                    }
                    await loadMembers();
                    toastSuccess(t("settings.team.memberUpdated"));
                  }}
                  onToggle={async () => {
                    const { error } = await supabase
                      .from("team_members")
                      .update({ is_active: !row.is_active })
                      .eq("id", row.id);
                    if (error) {
                      toastError(t("settings.team.toggleError"));
                      return;
                    }
                    await loadMembers();
                    toastSuccess(row.is_active ? t("settings.team.memberDisabled") : t("settings.team.memberEnabled"));
                  }}
                  onDelete={() =>
                    setPendingDelete({
                      label: row.display_name,
                      onConfirm: async () => {
                        const { error } = await supabase.from("team_members").delete().eq("id", row.id);
                        if (error) {
                          toastError(t("settings.team.deleteError", { message: error.message }));
                          return;
                        }
                        await loadMembers();
                        toastSuccess(t("settings.team.memberDeleted"));
                      },
                    })
                  }
                  prefix={
                    <div className="flex shrink-0 items-center gap-2">
                      <label className="group relative cursor-pointer" title={t("settings.team.changePhoto")}>
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
                              toastError(t("settings.team.uploadError", { error: upload.error }));
                              return;
                            }
                            const { error: dbErr } = await supabase
                              .from("team_members")
                              .update({ avatar_url: upload.path })
                              .eq("id", row.id);
                            if (dbErr) {
                              toastError(t("settings.team.avatarSaveError"));
                              return;
                            }
                            await loadMembers();
                            toastSuccess(t("settings.team.avatarUpdated"));
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {color ? (
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={t("settings.team.colorTitle", { color })}
                        />
                      ) : null}
                    </div>
                  }
                />
              );
            })}
          </div>

          <p className="mt-3 text-[11px] text-[color:var(--foreground)]/45">{t("settings.team.colorsHint")}</p>
        </SettingsSection>
      </section>
    </>
  );
}
