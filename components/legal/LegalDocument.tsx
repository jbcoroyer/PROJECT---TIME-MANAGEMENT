import type { ReactNode } from "react";
import Link from "next/link";
import { AppMark, AppWordmark } from "../AppBrand";

type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export default function LegalDocument({ title, lastUpdated, children }: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <AppMark className="h-8 w-8" />
            <AppWordmark size="compact" />
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/privacy" className="text-[color:var(--foreground)]/60 hover:text-[var(--foreground)]">
              Confidentialité
            </Link>
            <Link href="/terms" className="text-[color:var(--foreground)]/60 hover:text-[var(--foreground)]">
              CGU
            </Link>
            <Link href="/legal" className="text-[color:var(--foreground)]/60 hover:text-[var(--foreground)]">
              Mentions légales
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="mt-2 text-sm text-[color:var(--foreground)]/50">
          Dernière mise à jour : {lastUpdated}
        </p>
        <article className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-[color:var(--foreground)]/80">
          {children}
        </article>
      </main>
    </div>
  );
}
