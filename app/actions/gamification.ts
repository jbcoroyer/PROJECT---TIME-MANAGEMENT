"use server";

import { revalidatePath } from "next/cache";
import { tutorialById, parseGamificationRow } from "../../lib/gamification/catalog";
import type { GamificationProfile, TutorialId, TutorialProgress } from "../../lib/gamification/types";
import { createServerSupabase } from "../../lib/server/supabaseServer";

const FULL_SELECT =
  "gamification_xp, gamification_badges, gamification_state, first_task_tutorial_completed_at";
const MINIMAL_SELECT = "first_task_tutorial_completed_at";

async function loadGamificationRow(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
): Promise<GamificationProfile> {
  const full = await supabase.from("profiles").select(FULL_SELECT).eq("id", userId).maybeSingle();

  if (!full.error && full.data) {
    return parseGamificationRow(full.data);
  }

  const minimal = await supabase
    .from("profiles")
    .select(MINIMAL_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (minimal.error) throw new Error(minimal.error.message);

  return {
    xp: 0,
    badges: [],
    tutorials: {},
    firstTaskTutorialCompleted: Boolean(minimal.data?.first_task_tutorial_completed_at),
  };
}

export async function getGamificationProfile(): Promise<
  { ok: true; profile: GamificationProfile } | { ok: false; error: string }
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Non authentifié." };

  try {
    const profile = await loadGamificationRow(supabase, user.id);
    return { ok: true, profile };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inconnue." };
  }
}

export async function saveTutorialProgress(
  tutorialId: TutorialId,
  progress: TutorialProgress,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Non authentifié." };

  try {
    const current = await loadGamificationRow(supabase, user.id);
    const nextState = {
      ...current.tutorials,
      [tutorialId]: {
        ...progress,
        updatedAt: new Date().toISOString(),
      },
    };

    const { error } = await supabase
      .from("profiles")
      .update({ gamification_state: nextState })
      .eq("id", user.id);

    if (error) return { ok: false, error: error.message };
  } catch {
    /* colonnes gamification absentes — le client utilise localStorage */
    return { ok: true };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function completeTutorialWithRewards(
  tutorialId: TutorialId,
): Promise<{ ok: boolean; error?: string; xpGained?: number; badgeId?: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "Non authentifié." };

  const def = tutorialById(tutorialId);
  if (!def) return { ok: false, error: "Tutoriel inconnu." };

  try {
    const current = await loadGamificationRow(supabase, user.id);
    const existing = current.tutorials[tutorialId];
    if (existing?.status === "completed") {
      return { ok: true, xpGained: 0, badgeId: def.badgeId };
    }

    const badges = current.badges.includes(def.badgeId)
      ? current.badges
      : [...current.badges, def.badgeId];

    const nextState = {
      ...current.tutorials,
      [tutorialId]: {
        status: "completed" as const,
        step: "done",
        updatedAt: new Date().toISOString(),
      },
    };

    const patch: Record<string, unknown> = {
      gamification_xp: current.xp + def.xpReward,
      gamification_badges: badges,
      gamification_state: nextState,
    };

    if (tutorialId === "first_task") {
      patch.first_task_tutorial_completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) return { ok: false, error: error.message };
  } catch {
    if (tutorialId === "first_task") {
      const { error } = await supabase
        .from("profiles")
        .update({ first_task_tutorial_completed_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) return { ok: false, error: error.message };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, xpGained: def.xpReward, badgeId: def.badgeId };
}

export async function completeFirstTaskTutorial(): Promise<{ ok: boolean; error?: string }> {
  const result = await completeTutorialWithRewards("first_task");
  return { ok: result.ok, error: result.error };
}

export async function skipTutorial(
  tutorialId: TutorialId,
): Promise<{ ok: boolean; error?: string }> {
  return saveTutorialProgress(tutorialId, { status: "skipped", step: "done" });
}
