-- Image de couverture optionnelle par événement (chemin storage event-documents).
alter table public.events
  add column if not exists cover_image_path text;

comment on column public.events.cover_image_path is
  'Chemin storage (bucket event-documents) de l''image de couverture.';
