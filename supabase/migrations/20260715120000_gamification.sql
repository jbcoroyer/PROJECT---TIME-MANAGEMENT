-- Gamification : XP, badges et progression des tutoriels par profil

alter table public.profiles
  add column if not exists gamification_xp integer not null default 0;

alter table public.profiles
  add column if not exists gamification_badges text[] not null default '{}';

alter table public.profiles
  add column if not exists gamification_state jsonb not null default '{}'::jsonb;

comment on column public.profiles.gamification_xp is 'Points d''expérience cumulés (badges, quêtes).';
comment on column public.profiles.gamification_badges is 'Identifiants de badges débloqués.';
comment on column public.profiles.gamification_state is 'Progression JSON des tutoriels / quêtes (statut, étape).';

-- Rétro-compat : comptes ayant déjà terminé le tutoriel première tâche
update public.profiles
set
  gamification_xp = gamification_xp + 100,
  gamification_badges = case
    when 'first_step' = any (gamification_badges) then gamification_badges
    else gamification_badges || array['first_step']::text[]
  end,
  gamification_state = gamification_state
    || jsonb_build_object(
      'first_task',
      jsonb_build_object('status', 'completed', 'step', 'done', 'updatedAt', coalesce(first_task_tutorial_completed_at, now())::text)
    )
where first_task_tutorial_completed_at is not null;
