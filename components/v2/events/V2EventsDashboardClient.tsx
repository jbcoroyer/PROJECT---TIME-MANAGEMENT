"use client";

import EventsHubWorkspace from "../../../components/events/EventsHubWorkspace";

export default function V2EventsDashboardClient() {
  return (
    <EventsHubWorkspace
      eventsBasePath="/events"
      kanbanPath="/dashboard/kanban"
      showRetexNav
    />
  );
}
