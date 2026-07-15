import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import V2DashboardHomePage from "../../../../components/v2/dashboard/V2DashboardHomePage";

const VALID_TABS = new Set([
  "kanban",
  "list",
  "todo",
  "calendar",
  "analytics",
  "archives",
  "workload",
]);

export default async function V2DashboardTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (tab === "inbox") {
    redirect("/dashboard/todo");
  }
  if (tab === "triage") {
    redirect("/asks/triage");
  }
  if (!VALID_TABS.has(tab)) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <V2DashboardHomePage />
    </Suspense>
  );
}
