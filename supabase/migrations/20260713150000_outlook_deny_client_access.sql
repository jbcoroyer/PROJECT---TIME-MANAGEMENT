-- Outlook : accès client explicitement interdit (service_role / backend uniquement).

drop policy if exists outlook_connections_deny_client on public.outlook_connections;
create policy outlook_connections_deny_client on public.outlook_connections
  for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists outlook_calendar_events_deny_client on public.outlook_calendar_events;
create policy outlook_calendar_events_deny_client on public.outlook_calendar_events
  for all to anon, authenticated
  using (false)
  with check (false);
