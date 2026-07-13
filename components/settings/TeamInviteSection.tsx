"use client";

import { useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { inviteTeamMember } from "../../app/actions/invites";
import { toastError, toastSuccess } from "../../lib/toast";

export default function TeamInviteSection() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await inviteTeamMember({ email, role });
      if (!result.ok) throw new Error(result.error);
      toastSuccess("Invitation envoyée.");
      setEmail("");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erreur d'invitation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="settings-team-invite" className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-[color:var(--foreground)]/50" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Inviter un collègue</h2>
      </div>
      <p className="mt-2 text-sm text-[color:var(--foreground)]/65">
        Envoyez une invitation par e-mail. Votre collègue recevra un lien pour créer son mot de passe et
        rejoindre votre espace.
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground)]/35" />
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collegue@entreprise.com"
              className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="invite-role" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
            Rôle
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "user" | "admin")}
            className="ui-focus-ring rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm"
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="ui-btn ui-btn-primary px-4 py-2.5 text-sm"
        >
          {busy ? "Envoi…" : "Inviter"}
        </button>
      </form>
    </section>
  );
}
