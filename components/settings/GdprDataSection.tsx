"use client";

import { useState } from "react";
import { Download, Shield, Trash2 } from "lucide-react";
import {
  exportMyPersonalData,
  exportOrganizationData,
  requestAccountDeletion,
} from "../../app/actions/gdpr";
import { useCurrentUser } from "../../lib/useCurrentUser";
import { toastError, toastSuccess } from "../../lib/toast";

function downloadJson(filename: string, data: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function GdprDataSection() {
  const { user } = useCurrentUser();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleExportPersonal() {
    setBusy("personal");
    try {
      const result = await exportMyPersonalData();
      if (!result.ok) throw new Error(result.error);
      downloadJson("workspace-mes-donnees.json", result.payload);
      toastSuccess("Export personnel téléchargé.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Export impossible");
    } finally {
      setBusy(null);
    }
  }

  async function handleExportOrg() {
    setBusy("org");
    try {
      const result = await exportOrganizationData();
      if (!result.ok) throw new Error(result.error);
      downloadJson("workspace-organisation.json", result.payload);
      toastSuccess("Export organisation téléchargé.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Export impossible");
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Supprimer définitivement votre compte ? Cette action est irréversible.",
    );
    if (!confirmed) return;

    setBusy("delete");
    try {
      const result = await requestAccountDeletion();
      if (!result.ok) throw new Error(result.error);
      toastSuccess("Compte supprimé. Déconnexion…");
      window.location.href = "/login";
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-[color:var(--foreground)]/50" />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Données personnelles (RGPD)</h2>
      </div>
      <p className="mt-2 text-sm text-[color:var(--foreground)]/65">
        Exportez vos données ou demandez la suppression de votre compte conformément au RGPD.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void handleExportPersonal()}
          className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--surface)] disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {busy === "personal" ? "Export…" : "Exporter mes données"}
        </button>
        {user?.isAdmin ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void handleExportOrg()}
            className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--surface)] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {busy === "org" ? "Export…" : "Exporter l'organisation"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void handleDeleteAccount()}
          className="ui-transition ui-btn ui-btn-outline-danger inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {busy === "delete" ? "Suppression…" : "Supprimer mon compte"}
        </button>
      </div>
    </section>
  );
}
