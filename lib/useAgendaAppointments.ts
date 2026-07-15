"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { useRealtimeReload } from "./useRealtimeReload";
import type { AgendaAppointment, AppointmentStatus, AppointmentSource } from "./agenda/agendaTypes";
import { APPOINTMENT_STATUS_COLORS } from "./agenda/agendaTypes";

type AppointmentDbRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  host_team_member_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_message: string | null;
  location: string | null;
  meeting_url: string | null;
  color: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapRow(row: AppointmentDbRow): AgendaAppointment {
  const status = row.status as AppointmentStatus;
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: ["pending", "confirmed", "cancelled", "completed"].includes(status)
      ? status
      : "confirmed",
    source: row.source === "public_booking" ? "public_booking" : "internal",
    hostTeamMemberId: row.host_team_member_id,
    guestName: row.guest_name ?? "",
    guestEmail: row.guest_email ?? "",
    guestPhone: row.guest_phone ?? "",
    guestMessage: row.guest_message ?? "",
    location: row.location ?? "",
    meetingUrl: row.meeting_url ?? "",
    color: row.color ?? APPOINTMENT_STATUS_COLORS.confirmed,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

export function useAgendaAppointments(rangeStart: Date, rangeEnd: Date) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agenda_appointments")
        .select(
          "id, title, starts_at, ends_at, status, source, host_team_member_id, guest_name, guest_email, guest_phone, guest_message, location, meeting_url, color, cancelled_at, created_at, updated_at",
        )
        .gte("starts_at", rangeStart.toISOString())
        .lte("starts_at", rangeEnd.toISOString())
        .order("starts_at", { ascending: true });
      if (error) throw error;
      setAppointments(((data ?? []) as AppointmentDbRow[]).map(mapRow));
    } finally {
      setLoading(false);
    }
  }, [supabase, rangeStart, rangeEnd]);

  useEffect(() => {
    void load().catch(() => setAppointments([]));
  }, [load]);

  useRealtimeReload({
    table: "agenda_appointments",
    channelName: "agenda-appointments-realtime",
    onChange: useCallback(() => {
      void load();
    }, [load]),
  });

  return { appointments, loading, reload: load };
}

export type { AppointmentSource };
