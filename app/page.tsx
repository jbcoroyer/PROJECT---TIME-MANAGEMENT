"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthScreen, { AuthLoadingShell } from "../components/auth/AuthScreen";
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
    router.replace("/dashboard/kanban");
  }, [loading, brandingLoading, user, branding.isConfigured, router]);

  if (loading || brandingLoading || user) {
    return <AuthLoadingShell />;
  }

  return <AuthScreen cleanPath="/" />;
}
