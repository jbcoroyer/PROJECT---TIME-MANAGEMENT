"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import {
  clearInvalidSupabaseSession,
  isInvalidRefreshTokenError,
} from "./supabaseAuthRecovery";
import { resolveStorageAssetUrl } from "./storageClient";
import { syncUserDisplayName } from "./syncUserDisplayName";
import {
  isPlaceholderDisplayName,
  resolveUserDisplayName,
} from "./userDisplayName";

export type CurrentUser = {
  id: string;
  email: string;
  organizationId: string | null;
  displayName: string | null;
  teamMemberId: string | null;
  teamMemberName: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  role: "admin" | "user";
  isAdmin: boolean;
  firstTaskTutorialCompleted: boolean;
};

type CurrentUserContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  reload: () => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

async function fetchProfile(
  supabase: ReturnType<typeof getSupabaseBrowser>,
  authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
): Promise<CurrentUser> {
  await syncUserDisplayName(supabase);

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, team_member_id, role, organization_id, first_task_tutorial_completed_at, team_members(display_name, job_title, avatar_url)",
    )
    .eq("id", authUser.id)
    .maybeSingle();

  const member = (profile?.team_members as {
    display_name?: string;
    job_title?: string | null;
    avatar_url?: string | null;
  } | null) ?? null;

  const role = (profile?.role as string | null) === "admin" ? "admin" : "user";
  const rawAvatar = member?.avatar_url ?? null;
  const avatarUrl = rawAvatar
    ? await resolveStorageAssetUrl(supabase, "member-avatars", rawAvatar)
    : null;

  const teamMemberName = member?.display_name ?? null;
  const profileDisplayName = (profile?.display_name as string | null) ?? null;
  const email = authUser.email ?? "";
  const resolvedDisplayName = resolveUserDisplayName({
    teamMemberName,
    displayName: profileDisplayName,
    email,
    authMetadata: authUser.user_metadata ?? null,
  });

  const safeTeamMemberName =
    resolvedDisplayName ||
    (teamMemberName && !isPlaceholderDisplayName(teamMemberName, email) ? teamMemberName : null);
  const safeDisplayName =
    resolvedDisplayName ||
    (profileDisplayName && !isPlaceholderDisplayName(profileDisplayName, email)
      ? profileDisplayName
      : null);

  return {
    id: authUser.id,
    email,
    organizationId: (profile?.organization_id as string | null) ?? null,
    displayName: safeDisplayName,
    teamMemberId: (profile?.team_member_id as string | null) ?? null,
    teamMemberName: safeTeamMemberName,
    jobTitle: member?.job_title ?? null,
    avatarUrl,
    role,
    isAdmin: role === "admin",
    firstTaskTutorialCompleted: Boolean(profile?.first_task_tutorial_completed_at),
  };
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<CurrentUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadUser = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!silent && !userRef.current) {
        setLoading(true);
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError && isInvalidRefreshTokenError(sessionError)) {
        const redirected = await clearInvalidSupabaseSession(supabase);
        if (!redirected) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const sessionUser = session?.user;
      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        const nextUser = await fetchProfile(supabase, authUser);
        setUser(nextUser);
      } catch {
        if (!userRef.current) setUser(null);
      } finally {
        setLoading(false);
      }

      // Validation serveur en arrière-plan (sans bloquer l'UI).
      void supabase.auth.getUser().then(({ error: authError }: { error: Error | null }) => {
        if (authError && isInvalidRefreshTokenError(authError)) {
          void clearInvalidSupabaseSession(supabase);
        }
      });
    },
    [supabase],
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await loadUser();
    };

    void run();

    const { data: listener } = supabase.auth.onAuthStateChange((event: string) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        return;
      }
      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
        void loadUser({ silent: event === "TOKEN_REFRESHED" });
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadUser, supabase]);

  const reload = useCallback(() => {
    void loadUser();
  }, [loadUser]);

  const value = useMemo(
    () => ({ user, loading, reload }),
    [user, loading, reload],
  );

  return (
    <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser doit être utilisé sous CurrentUserProvider.");
  }
  return ctx;
}
