-- Suivi de complétion du tutoriel obligatoire « première tâche »
alter table public.profiles
  add column if not exists first_task_tutorial_completed_at timestamptz;

comment on column public.profiles.first_task_tutorial_completed_at is
  'Horodatage de complétion du tutoriel gamifié de création de la première tâche.';

-- Les comptes existants ne doivent pas revoir le tutoriel obligatoire.
update public.profiles
set first_task_tutorial_completed_at = coalesce(first_task_tutorial_completed_at, created_at)
where first_task_tutorial_completed_at is null;
