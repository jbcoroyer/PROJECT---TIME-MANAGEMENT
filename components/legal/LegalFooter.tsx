import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="mt-8 border-t border-[var(--line)] pt-6 text-center text-xs text-[color:var(--foreground)]/45">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/legal" className="hover:text-[color:var(--foreground)]/70 hover:underline">
          Mentions légales
        </Link>
        <Link href="/privacy" className="hover:text-[color:var(--foreground)]/70 hover:underline">
          Politique de confidentialité
        </Link>
        <Link href="/terms" className="hover:text-[color:var(--foreground)]/70 hover:underline">
          Conditions générales
        </Link>
        <Link href="/pricing" className="hover:text-[color:var(--foreground)]/70 hover:underline">
          Tarifs
        </Link>
      </nav>
      <p className="mt-3">
        Conformément au RGPD, vos données personnelles sont traitées conformément à notre politique de
        confidentialité. Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression.
      </p>
    </footer>
  );
}
