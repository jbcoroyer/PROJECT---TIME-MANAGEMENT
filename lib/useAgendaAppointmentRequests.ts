"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { useRealtimeReload } from "./useRealtimeReload";
import type { AgendaAppointmentRequest, AppointmentRequestStatus } from "./agenda/agendaTypes";

type RequestDbRow = {
  id: string;
  agenda_settings_id: string;
  requested_starts_at: string;
  requested_ends_at: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_message: string | null;
  status: string;
  appointment_id: string | null;
  rejection_reason: string | null;
  decided_at: string | null;
  decided_by_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapRow(row: RequestDbRow): AgendaAppointmentRequest {
  const status = row.status as AppointmentRequestStatus;
  return {
    id: row.id,
    agendaSettingsId: row.agenda_settings_id,
    requestedStartsAt: row.requested_starts_at,
    requestedEndsAt: row.requested_ends_at,
    guestName: row.guest_name ?? "",
    guestEmail: row.guest_email ?? "",
    guestPhone: row.guest_phone ?? "",
    guestMessage: row.guest_message ?? "",
    status: ["pending", "accepted", "rejected"].includes(status) ? status : "pending",
    appointmentId: row.appointment_id,
    rejectionReason: row.rejection_reason ?? "",
    decidedAt: row.decided_at,
    decidedByUserId: row.decided_by_user_id,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

export function useAgendaAppointmentRequests(status?: AppointmentRequestStatus) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [requests, setRequests] = useState<AgendaAppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("agenda_appointment_requests")
        .select(
          "id, agenda_settings_id, requested_starts_at, requested_ends_at, guest_name, guest_email, guest_phone, guest_message, status, appointment_id, rejection_reason, decided_at, decided_by_user_id, created_at, updated_at",
        )
        .order("created_at", { ascending: false });

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;
      setRequests(((data ?? []) as RequestDbRow[]).map(mapRow));
    } finally {
      setLoading(false);
    }
  }, [supabase, status]);

  useEffect(() => {
    void load().catch(() => setRequests([]));
  }, [load]);

  useRealtimeReload({
    table: "agenda_appointment_requests",
    channelName: "agenda-appointment-requests-realtime",
    onChange: useCallback(() => {
      void load();
    }, [load]),
  });

  return { requests, loading, reload: load };
}
