"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PublicProductDemo from "../components/PublicProductDemo";
import { useCurrentUser } from "../lib/useCurrentUser";
import { useBranding } from "../lib/brandingContext";
import { SETUP_PATH } from "../lib/setupPaths";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const { branding, loading: brandingLoading } = useBranding();

  useEffect(() => {
    if (loading || brandingLoading || !user) return;
    if (!branding.isConfigured) {
      router.replace(SETUP_PATH);
      return;
    }
    router.replace("/v2/dashboard/kanban");
  }, [loading, brandingLoading, user, branding.isConfigured, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 lg:px-8">
          <div className="ui-surface h-20 animate-pulse rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="ui-surface h-64 animate-pulse rounded-2xl" />
            <div className="ui-surface h-64 animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return <PublicProductDemo />;
}
