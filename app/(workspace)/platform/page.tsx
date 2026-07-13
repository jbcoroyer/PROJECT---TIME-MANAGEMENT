import { redirect } from "next/navigation";
import PlatformAdminPage from "../../../components/platform/PlatformAdminPage";
import { requirePlatformAdmin } from "../../../lib/server/platformAdmin";

export default async function PlatformPage() {
  const gate = await requirePlatformAdmin();
  if (!gate.ok) {
    redirect("/dashboard");
  }

  return <PlatformAdminPage />;
}
