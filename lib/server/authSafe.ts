import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isInvalidRefreshTokenError } from "../supabaseAuthRecovery";

/** Lecture serveur de l'utilisateur avec nettoyage des cookies de session invalides. */
export async function getServerAuthUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && isInvalidRefreshTokenError(error)) {
    await supabase.auth.signOut();
    return null;
  }

  return user;
}
