export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type WorkDayConfig = {
  enabled: boolean;
  start: string;
  end: string;
};

export type WorkHours = Record<WeekdayKey, WorkDayConfig>;

export type AgendaSettingsStatus = "active" | "paused";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type AppointmentSource = "internal" | "public_booking";

export type AgendaSettings = {
  id: string;
  title: string;
  welcomeMessage: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
  bookingHorizonDays: number;
  minNoticeHours: number;
  workHours: WorkHours;
  autoConfirm: boolean;
  publicPath: string;
  status: AgendaSettingsStatus;
  createdAt: string;
};

export type AgendaAppointment = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  hostTeamMemberId: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestMessage: string;
  location: string;
  meetingUrl: string;
  color: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgendaAppointmentNote = {
  id: string;
  appointmentId: string;
  authorUserId: string | null;
  body: string;
  createdAt: string;
};

export type BookingSlot = {
  start: string;
  end: string;
};

export const WEEKDAY_KEYS: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  sun: "Dimanche",
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Terminé",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "#d97706",
  confirmed: "#0d9488",
  cancelled: "#94a3b8",
  completed: "#6366f1",
};
