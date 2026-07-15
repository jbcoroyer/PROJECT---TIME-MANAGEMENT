/** Chemin public de réservation pour une organisation. */
export function defaultPublicPathForAgenda(settingsId: string): string {
  return `/agenda/b/${settingsId}`;
}
