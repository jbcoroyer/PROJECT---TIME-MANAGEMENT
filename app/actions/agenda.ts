"use server";

import { revalidatePath } from "next/cache";
import { defaultPublicPathForAgenda } from "../../lib/agenda/agendaPaths";
import {
  getAvailableSlotsForDate,
  normalizeWorkHours,
} from "../../lib/agenda/bookingSlots";
import type {
  AgendaAppointment,
  AgendaAppointmentNote,
  AgendaSettings,
  AppointmentStatus,
  WorkHours,
} from "../../lib/agenda/agendaTypes";
import { APPOINTMENT_STATUS_COLORS } from "../../lib/agenda/agendaTypes";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { createSupabaseAdmin } from "../../lib/server/supabaseAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";

type ActionResult = { ok: true } | { ok: false; error: string };

type SettingsRow = {
  id: string;
  title: string | null;
  welcome_message: string | null;
  slot_duration_minutes: number | null;
  buffer_minutes: number | null;
  booking_horizon_days: number | null;
  min_notice_hours: number | null;
  work_hours: unknown;
  auto_confirm: boolean | null;
  public_path: string | null;
  status: string | null;
  created_at: string | null;
  organization_id: string;
};

type AppointmentRow = {
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

type NoteRow = {
  id: string;
  appointment_id: string;
  author_user_id: string | null;
  body: string;
  created_at: string | null;
};

function mapSettings(row: SettingsRow): AgendaSettings {
  return {
    id: row.id,
    title: row.title ?? "Prendre rendez-vous",
    welcomeMessage: row.welcome_message ?? "",
    slotDurationMinutes: row.slot_duration_minutes ?? 30,
    bufferMinutes: row.buffer_minutes ?? 10,
    bookingHorizonDays: row.booking_horizon_days ?? 42,
    minNoticeHours: row.min_notice_hours ?? 4,
    workHours: normalizeWorkHours(row.work_hours),
    autoConfirm: row.auto_confirm ?? true,
    publicPath: row.public_path ?? defaultPublicPathForAgenda(row.id),
    status: row.status === "paused" ? "paused" : "active",
    createdAt: row.created_at ?? "",
  };
}

function mapAppointment(row: AppointmentRow): AgendaAppointment {
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

function mapNote(row: NoteRow): AgendaAppointmentNote {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    authorUserId: row.author_user_id,
    body: row.body,
    createdAt: row.created_at ?? "",
  };
}

function revalidateAgenda() {
  revalidatePath("/agenda");
  revalidatePath("/todo");
}

/** Paramètres agenda de l'organisation (crée des valeurs par défaut si absent). */
export async function getOrgAgendaSettings(): Promise<AgendaSettings | null> {
  const ctx = await getServerOrgContext();
  if (!ctx) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("agenda_settings")
    .select(
      "id, title, welcome_message, slot_duration_minutes, buffer_minutes, booking_horizon_days, min_notice_hours, work_hours, auto_confirm, public_path, status, created_at, organization_id",
    )
    .maybeSingle();

  if (data) return mapSettings(data as SettingsRow);

  const settingsId = crypto.randomUUID();
  const publicPath = defaultPublicPathForAgenda(settingsId);
  const { data: created, error } = await supabase
    .from("agenda_settings")
    .insert({
      id: settingsId,
      organization_id: ctx.organizationId,
      title: "Prendre rendez-vous",
      welcome_message:
        "Choisissez un créneau disponible. Vous recevrez une confirmation par e-mail.",
      public_path: publicPath,
      status: "active",
    })
    .select(
      "id, title, welcome_message, slot_duration_minutes, buffer_minutes, booking_horizon_days, min_notice_hours, work_hours, auto_confirm, public_path, status, created_at, organization_id",
    )
    .single();

  if (error || !created) return null;
  return mapSettings(created as SettingsRow);
}

export type UpdateAgendaSettingsInput = {
  title?: string;
  welcomeMessage?: string;
  slotDurationMinutes?: number;
  bufferMinutes?: number;
  bookingHorizonDays?: number;
  minNoticeHours?: number;
  workHours?: WorkHours;
  autoConfirm?: boolean;
  status?: "active" | "paused";
};

export async function updateAgendaSettings(
  settingsId: string,
  input: UpdateAgendaSettingsInput,
): Promise<ActionResult> {
  if (!settingsId) return { ok: false, error: "Paramètres introuvables." };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.welcomeMessage !== undefined) patch.welcome_message = input.welcomeMessage.trim();
  if (input.slotDurationMinutes !== undefined) patch.slot_duration_minutes = input.slotDurationMinutes;
  if (input.bufferMinutes !== undefined) patch.buffer_minutes = input.bufferMinutes;
  if (input.bookingHorizonDays !== undefined) patch.booking_horizon_days = input.bookingHorizonDays;
  if (input.minNoticeHours !== undefined) patch.min_notice_hours = input.minNoticeHours;
  if (input.workHours !== undefined) patch.work_hours = input.workHours;
  if (input.autoConfirm !== undefined) patch.auto_confirm = input.autoConfirm;
  if (input.status !== undefined) patch.status = input.status;

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("agenda_settings").update(patch).eq("id", settingsId);
  if (error) return { ok: false, error: error.message ?? "Mise à jour impossible." };

  revalidateAgenda();
  return { ok: true };
}

/** Rendez-vous sur une plage de dates. */
export async function listAgendaAppointments(
  rangeStart: string,
  rangeEnd: string,
): Promise<AgendaAppointment[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("agenda_appointments")
    .select(
      "id, title, starts_at, ends_at, status, source, host_team_member_id, guest_name, guest_email, guest_phone, guest_message, location, meeting_url, color, cancelled_at, created_at, updated_at",
    )
    .gte("starts_at", rangeStart)
    .lte("starts_at", rangeEnd)
    .order("starts_at", { ascending: true });

  if (error) return [];
  return ((data ?? []) as AppointmentRow[]).map(mapAppointment);
}

export type CreateAppointmentInput = {
  title: string;
  startsAt: string;
  endsAt: string;
  hostTeamMemberId?: string | null;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestMessage?: string;
  location?: string;
  meetingUrl?: string;
  color?: string;
  status?: AppointmentStatus;
};

export async function createAgendaAppointment(
  input: CreateAppointmentInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Le titre est requis." };
  if (!input.startsAt || !input.endsAt) {
    return { ok: false, error: "Les horaires sont requis." };
  }
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    return { ok: false, error: "L'heure de fin doit être après le début." };
  }

  const ctx = await getServerOrgContext();
  if (!ctx) return { ok: false, error: "Vous devez être connecté." };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("agenda_appointments")
    .insert({
      organization_id: ctx.organizationId,
      title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      host_team_member_id: input.hostTeamMemberId ?? null,
      guest_name: input.guestName?.trim() ?? "",
      guest_email: input.guestEmail?.trim() ?? "",
      guest_phone: input.guestPhone?.trim() ?? "",
      guest_message: input.guestMessage?.trim() ?? "",
      location: input.location?.trim() ?? "",
      meeting_url: input.meetingUrl?.trim() ?? "",
      color: input.color ?? APPOINTMENT_STATUS_COLORS.confirmed,
      status: input.status ?? "confirmed",
      source: "internal",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Création impossible." };
  }

  revalidateAgenda();
  return { ok: true, id: data.id as string };
}

export type UpdateAppointmentInput = Partial<CreateAppointmentInput> & {
  status?: AppointmentStatus;
};

export async function updateAgendaAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput,
): Promise<ActionResult> {
  if (!appointmentId) return { ok: false, error: "Rendez-vous introuvable." };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;
  if (input.hostTeamMemberId !== undefined) patch.host_team_member_id = input.hostTeamMemberId;
  if (input.guestName !== undefined) patch.guest_name = input.guestName.trim();
  if (input.guestEmail !== undefined) patch.guest_email = input.guestEmail.trim();
  if (input.guestPhone !== undefined) patch.guest_phone = input.guestPhone.trim();
  if (input.guestMessage !== undefined) patch.guest_message = input.guestMessage.trim();
  if (input.location !== undefined) patch.location = input.location.trim();
  if (input.meetingUrl !== undefined) patch.meeting_url = input.meetingUrl.trim();
  if (input.color !== undefined) patch.color = input.color;
  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "cancelled") {
      patch.cancelled_at = new Date().toISOString();
    }
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("agenda_appointments")
    .update(patch)
    .eq("id", appointmentId);

  if (error) return { ok: false, error: error.message ?? "Mise à jour impossible." };
  revalidateAgenda();
  return { ok: true };
}

export async function cancelAgendaAppointment(appointmentId: string): Promise<ActionResult> {
  return updateAgendaAppointment(appointmentId, { status: "cancelled" });
}

export async function listAppointmentNotes(
  appointmentId: string,
): Promise<AgendaAppointmentNote[]> {
  if (!appointmentId) return [];
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("agenda_appointment_notes")
    .select("id, appointment_id, author_user_id, body, created_at")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as NoteRow[]).map(mapNote);
}

export async function addAppointmentNote(
  appointmentId: string,
  body: string,
): Promise<ActionResult> {
  const clean = body.trim();
  if (!appointmentId || !clean) return { ok: false, error: "Note vide." };

  const ctx = await getServerOrgContext();
  if (!ctx) return { ok: false, error: "Vous devez être connecté." };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("agenda_appointment_notes").insert({
    appointment_id: appointmentId,
    organization_id: ctx.organizationId,
    author_user_id: user?.id ?? null,
    body: clean,
  });

  if (error) return { ok: false, error: error.message ?? "Ajout impossible." };
  revalidateAgenda();
  return { ok: true };
}

export type PublicAgendaMeta = {
  settingsId: string;
  title: string;
  welcomeMessage: string;
  appName: string;
  slotDurationMinutes: number;
  bookingHorizonDays: number;
  workHours: WorkHours;
  status: "active" | "paused";
};

export async function getPublicAgendaMeta(settingsId: string): Promise<PublicAgendaMeta | null> {
  if (!settingsId) return null;

  const admin = createSupabaseAdmin();
  const { data: settings } = await admin
    .from("agenda_settings")
    .select(
      "id, title, welcome_message, slot_duration_minutes, booking_horizon_days, work_hours, status, organization_id",
    )
    .eq("id", settingsId)
    .eq("status", "active")
    .maybeSingle();

  if (!settings) return null;

  const orgId = settings.organization_id as string;
  const { data: appSettings } = await admin
    .from("app_settings")
    .select("app_name")
    .eq("organization_id", orgId)
    .maybeSingle();

  return {
    settingsId: settings.id as string,
    title: (settings.title as string) ?? "Prendre rendez-vous",
    welcomeMessage: (settings.welcome_message as string) ?? "",
    appName: (appSettings?.app_name as string) ?? "Workspace",
    slotDurationMinutes: (settings.slot_duration_minutes as number) ?? 30,
    bookingHorizonDays: (settings.booking_horizon_days as number) ?? 42,
    workHours: normalizeWorkHours(settings.work_hours),
    status: "active",
  };
}

export async function getPublicAvailableSlots(
  settingsId: string,
  dateIso: string,
): Promise<{ ok: true; slots: { start: string; end: string }[] } | { ok: false; error: string }> {
  if (!settingsId || !dateIso) return { ok: false, error: "Paramètres invalides." };

  const admin = createSupabaseAdmin();
  const { data: settings } = await admin
    .from("agenda_settings")
    .select(
      "id, slot_duration_minutes, buffer_minutes, min_notice_hours, work_hours, status, organization_id",
    )
    .eq("id", settingsId)
    .eq("status", "active")
    .maybeSingle();

  if (!settings) return { ok: false, error: "Réservation indisponible." };

  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Date invalide." };

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const { data: appointments } = await admin
    .from("agenda_appointments")
    .select("starts_at, ends_at")
    .eq("organization_id", settings.organization_id as string)
    .neq("status", "cancelled")
    .gte("starts_at", dayStart.toISOString())
    .lte("starts_at", dayEnd.toISOString());

  const busy = (appointments ?? []).map((row) => ({
    start: new Date((row as { starts_at: string }).starts_at),
    end: new Date((row as { ends_at: string }).ends_at),
  }));

  const slots = getAvailableSlotsForDate(
    date,
    normalizeWorkHours(settings.work_hours),
    busy,
    (settings.slot_duration_minutes as number) ?? 30,
    (settings.buffer_minutes as number) ?? 10,
    (settings.min_notice_hours as number) ?? 4,
    new Date(),
  );

  return { ok: true, slots };
}

export type SubmitPublicBookingInput = {
  slotStart: string;
  slotEnd: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestMessage?: string;
};

export async function submitPublicBooking(
  settingsId: string,
  input: SubmitPublicBookingInput,
): Promise<ActionResult> {
  if (!settingsId) return { ok: false, error: "Réservation indisponible." };

  const guestName = input.guestName?.trim();
  const guestEmail = input.guestEmail?.trim();
  if (!guestName || !guestEmail) {
    return { ok: false, error: "Nom et e-mail requis." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return { ok: false, error: "E-mail invalide." };
  }

  const slotCheck = await getPublicAvailableSlots(settingsId, input.slotStart);
  if (!slotCheck.ok) return slotCheck;

  const slotOk = slotCheck.slots.some(
    (s) => s.start === input.slotStart && s.end === input.slotEnd,
  );
  if (!slotOk) {
    return { ok: false, error: "Ce créneau n'est plus disponible." };
  }

  const admin = createSupabaseAdmin();
  const { data: settings } = await admin
    .from("agenda_settings")
    .select("id, title, auto_confirm, organization_id")
    .eq("id", settingsId)
    .eq("status", "active")
    .maybeSingle();

  if (!settings?.organization_id) {
    return { ok: false, error: "Réservation indisponible." };
  }

  const status = settings.auto_confirm ? "confirmed" : "pending";
  const title = `RDV — ${guestName}`;

  const { error } = await admin.from("agenda_appointments").insert({
    organization_id: settings.organization_id,
    title,
    starts_at: input.slotStart,
    ends_at: input.slotEnd,
    status,
    source: "public_booking",
    guest_name: guestName,
    guest_email: guestEmail,
    guest_phone: input.guestPhone?.trim() ?? "",
    guest_message: input.guestMessage?.trim() ?? "",
    color: status === "confirmed" ? APPOINTMENT_STATUS_COLORS.confirmed : APPOINTMENT_STATUS_COLORS.pending,
  });

  if (error) return { ok: false, error: error.message ?? "Réservation impossible." };

  revalidateAgenda();
  return { ok: true };
}

export type AgendaStats = {
  upcomingCount: number;
  pendingCount: number;
  todayCount: number;
};

export async function getAgendaStats(): Promise<AgendaStats> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("agenda_appointments")
    .select("id, starts_at, status")
    .neq("status", "cancelled")
    .gte("starts_at", now.toISOString());

  const rows = data ?? [];
  return {
    upcomingCount: rows.length,
    pendingCount: rows.filter((r) => (r as { status: string }).status === "pending").length,
    todayCount: rows.filter((r) => {
      const start = new Date((r as { starts_at: string }).starts_at);
      return start >= todayStart && start <= todayEnd;
    }).length,
  };
}
