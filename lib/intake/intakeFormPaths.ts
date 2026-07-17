/** Préfixe des URLs publiques de formulaires de demande. */
export const INTAKE_PUBLIC_PREFIX = "/asks/f/";

/** Chemin public par défaut pour un formulaire (identifiant technique). */
export function defaultPublicPathForIntakeForm(formId: string): string {
  return `${INTAKE_PUBLIC_PREFIX}${formId}`;
}

function slugifyIntakeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Chemin public lisible à partir du titre (suffixe aléatoire pour l'unicité). */
export function defaultPublicPathFromTitle(title: string): string {
  const base = slugifyIntakeTitle(title) || "formulaire";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${INTAKE_PUBLIC_PREFIX}${base}-${suffix}`;
}

/** Extrait le segment d'URL après /asks/f/ */
export function intakePublicSegment(publicPath: string): string {
  if (publicPath.startsWith(INTAKE_PUBLIC_PREFIX)) {
    return publicPath.slice(INTAKE_PUBLIC_PREFIX.length);
  }
  return publicPath.replace(/^\/+/, "");
}

/** Valide et normalise un chemin public personnalisé. */
export function normalizeIntakePublicPath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let path = trimmed;
  if (!path.startsWith("/")) {
    path = `${INTAKE_PUBLIC_PREFIX}${path.replace(/^\/+/, "")}`;
  }
  if (!path.startsWith(INTAKE_PUBLIC_PREFIX)) {
    return null;
  }

  const segment = intakePublicSegment(path);
  if (!segment || !/^[a-z0-9][a-z0-9-]{1,80}[a-z0-9]$|^[a-z0-9]{1,2}$/i.test(segment)) {
    return null;
  }

  return `${INTAKE_PUBLIC_PREFIX}${segment.toLowerCase()}`;
}
