"use client";

import EventsHubWorkspace from "../../../components/events/EventsHubWorkspace";
import { useCurrentUser } from "../../../lib/useCurrentUser";

export default function V2EventsDashboardClient() {
  const { user } = useCurrentUser();

  return (
    <EventsHubWorkspace
      eventsBasePath="/events"
      kanbanPath="/dashboard/kanban"
      showRetexNav
      defaultAdminName={user?.teamMemberName ?? user?.displayName ?? ""}
    />
  );
}
