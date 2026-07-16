import { t, type AppLocale } from "./index";

import type { AppointmentStatus, WeekdayKey } from "../agenda/agendaTypes";
import type { SocialPostStatus } from "../socialTypes";

const COLUMN_KEYS: Record<string, string> = {
  "À faire": "common.columns.todo",
  "En cours": "common.columns.inProgress",
  "En validation": "common.columns.inReview",
  "Terminé": "common.columns.done",
};

const PRIORITY_KEYS: Record<string, string> = {
  Basse: "common.priorities.low",
  Moyenne: "common.priorities.medium",
  Haute: "common.priorities.high",
};

const SOCIAL_STATUS_KEYS: Record<SocialPostStatus, string> = {
  Idée: "social.status.idea",
  Rédaction: "social.status.writing",
  "À valider": "social.status.toValidate",
  Planifié: "social.status.scheduled",
  Publié: "social.status.published",
  Annulé: "social.status.cancelled",
};

const WEEKDAY_FR_KEYS: Record<string, string> = {
  Dimanche: "social.insights.weekdays.sunday",
  Lundi: "social.insights.weekdays.monday",
  Mardi: "social.insights.weekdays.tuesday",
  Mercredi: "social.insights.weekdays.wednesday",
  Jeudi: "social.insights.weekdays.thursday",
  Vendredi: "social.insights.weekdays.friday",
  Samedi: "social.insights.weekdays.saturday",
};

/** Affiche une colonne Kanban (valeur stockée FR) dans la locale active. */
export function translateColumn(locale: AppLocale, column: string): string {
  const key = COLUMN_KEYS[column];
  return key ? t(locale, key) : column;
}

/** Affiche une priorité (valeur stockée FR) dans la locale active. */
export function translatePriority(locale: AppLocale, priority: string): string {
  const key = PRIORITY_KEYS[priority];
  return key ? t(locale, key) : priority;
}

/** Affiche un statut de post social (valeur stockée FR) dans la locale active. */
export function translateSocialStatus(locale: AppLocale, status: SocialPostStatus | string): string {
  const key = SOCIAL_STATUS_KEYS[status as SocialPostStatus];
  return key ? t(locale, key) : status;
}

/** Affiche un jour de la semaine (libellé FR stocké) dans la locale active. */
export function translateWeekdayLabel(locale: AppLocale, label: string): string {
  const key = WEEKDAY_FR_KEYS[label];
  return key ? t(locale, key) : label;
}

const AGENDA_WEEKDAY_KEYS: Record<WeekdayKey, string> = {
  sun: "agenda.weekday.sun",
  mon: "agenda.weekday.mon",
  tue: "agenda.weekday.tue",
  wed: "agenda.weekday.wed",
  thu: "agenda.weekday.thu",
  fri: "agenda.weekday.fri",
  sat: "agenda.weekday.sat",
};

const AGENDA_STATUS_KEYS: Record<AppointmentStatus, string> = {
  pending: "agenda.status.pending",
  confirmed: "agenda.status.confirmed",
  cancelled: "agenda.status.cancelled",
  completed: "agenda.status.completed",
};

/** Affiche un jour de la semaine agenda (clé WeekdayKey) dans la locale active. */
export function translateAgendaWeekday(locale: AppLocale, key: WeekdayKey): string {
  return t(locale, AGENDA_WEEKDAY_KEYS[key]);
}

/** Affiche un statut de rendez-vous dans la locale active. */
export function translateAppointmentStatus(locale: AppLocale, status: AppointmentStatus): string {
  return t(locale, AGENDA_STATUS_KEYS[status]);
}

export function createDisplayLabelHelpers(locale: AppLocale) {
  return {
    column: (value: string) => translateColumn(locale, value),
    priority: (value: string) => translatePriority(locale, value),
    socialStatus: (value: SocialPostStatus | string) => translateSocialStatus(locale, value),
    weekday: (value: string) => translateWeekdayLabel(locale, value),
    agendaWeekday: (key: WeekdayKey) => translateAgendaWeekday(locale, key),
    appointmentStatus: (status: AppointmentStatus) => translateAppointmentStatus(locale, status),
  };
}
