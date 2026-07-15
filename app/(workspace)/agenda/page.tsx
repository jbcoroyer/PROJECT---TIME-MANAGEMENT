import { Suspense } from "react";
import AgendaWorkspace from "../../../components/v2/agenda/AgendaWorkspace";
import { getAgendaStats, getOrgAgendaSettings } from "../../../app/actions/agenda";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function AgendaPageContent() {
  const [settings, stats] = await Promise.all([getOrgAgendaSettings(), getAgendaStats()]);
  if (!settings) redirect("/login");
  return <AgendaWorkspace settings={settings} stats={stats} />;
}

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-surface rounded-2xl p-8 text-center text-sm text-[var(--ink-muted)]">
          Chargement de l&apos;agenda…
        </div>
      }
    >
      <AgendaPageContent />
    </Suspense>
  );
}
