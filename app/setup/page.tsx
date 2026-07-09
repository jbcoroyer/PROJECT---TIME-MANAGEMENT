import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import SetupWizard from "../../components/setup/SetupWizard";
import { AppMark, AppWordmark } from "../../components/AppBrand";
import { getSetupAccess } from "../actions/setup";

export const metadata = {
  title: "Installation",
};

export default async function SetupPage() {
  const access = await getSetupAccess();

  if (access.isConfigured) {
    redirect("/v2/dashboard/kanban");
  }

  if (!access.isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <AppMark className="h-16 w-16" />
          </div>
          <AppWordmark size="login" />
          <p className="mt-4 text-sm text-[color:var(--foreground)]/65">
            Cette application n&apos;est pas encore configurée. Connectez-vous pour lancer l&apos;installation.
          </p>
          <Link
            href="/login"
            className="ui-transition mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Se connecter
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!access.canCompleteSetup) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <AppMark className="h-16 w-16" />
          </div>
          <h1 className="ui-display text-2xl font-bold">Installation en attente</h1>
          <p className="mt-4 text-sm text-[color:var(--foreground)]/65">
            L&apos;application n&apos;est pas encore configurée. Seul un administrateur peut terminer
            l&apos;installation. Contactez votre responsable ou connectez-vous avec un compte admin.
          </p>
          <Link
            href="/"
            className="ui-transition mt-8 inline-block text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <AppMark className="h-14 w-14" />
          </div>
          <h1 className="ui-display text-3xl font-bold text-[var(--foreground)]">Bienvenue</h1>
          <p className="mt-2 text-sm text-[color:var(--foreground)]/60">
            Quelques étapes pour personnaliser votre espace de travail.
          </p>
        </div>
        <SetupWizard />
      </div>
    </div>
  );
}
