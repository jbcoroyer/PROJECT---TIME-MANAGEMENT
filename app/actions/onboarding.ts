"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "../../lib/server/supabaseServer";

export async function completeFirstTaskTutorial(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Non authentifié." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ first_task_tutorial_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
