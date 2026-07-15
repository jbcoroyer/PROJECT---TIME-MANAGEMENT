/** Extrait un nom affichable depuis les metadata Supabase Auth (inscription, Google, etc.). */
export function resolveDisplayNameFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null;

  const display = trimString(metadata.display_name);
  if (display) return display;

  const fromParts = joinNameParts(
    trimString(metadata.first_name),
    trimString(metadata.last_name),
  );
  if (fromParts) return fromParts;

  const full = trimString(metadata.full_name) ?? trimString(metadata.name);
  if (full) return full;

  const fromGoogle = joinNameParts(
    trimString(metadata.given_name),
    trimString(metadata.family_name),
  );
  if (fromGoogle) return fromGoogle;

  return null;
}

function trimString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function joinNameParts(first: string | null, last: string | null): string | null {
  const combined = [first, last].filter(Boolean).join(" ").trim();
  return combined.length > 0 ? combined : null;
}

/** Nom placeholder (email ou partie locale) — à remplacer par le vrai nom. */
export function isPlaceholderDisplayName(
  name: string | null | undefined,
  email: string | null | undefined,
): boolean {
  const n = name?.trim();
  if (!n) return true;
  const e = email?.trim().toLowerCase();
  if (!e) return n.includes("@");
  if (n.toLowerCase() === e) return true;
  if (n.toLowerCase() === e.split("@")[0]) return true;
  return n.includes("@");
}

export type UserNameFields = {
  teamMemberName?: string | null;
  displayName?: string | null;
  email?: string | null;
  authMetadata?: Record<string, unknown> | null;
};

/** Nom à afficher dans l’UI (jamais l’email si un vrai nom est disponible). */
export function resolveUserDisplayName(user: UserNameFields | null | undefined): string {
  if (!user) return "";

  const fromMember = user.teamMemberName?.trim();
  if (fromMember && !isPlaceholderDisplayName(fromMember, user.email)) return fromMember;

  const fromProfile = user.displayName?.trim();
  if (fromProfile && !isPlaceholderDisplayName(fromProfile, user.email)) return fromProfile;

  const fromAuth = resolveDisplayNameFromMetadata(user.authMetadata ?? null);
  if (fromAuth && !isPlaceholderDisplayName(fromAuth, user.email)) return fromAuth;

  return fromMember || fromProfile || fromAuth || "";
}
