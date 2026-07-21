import type { WeekdayKey, WorkDayConfig, WorkHours } from "./agendaTypes";

export type SetupAvailabilityInput = {
  weekdaysEnabled: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
};

export const DEFAULT_SETUP_AVAILABILITY: SetupAvailabilityInput = {
  weekdaysEnabled: true,
  morningStart: "09:00",
  morningEnd: "12:30",
  afternoonStart: "14:00",
  afternoonEnd: "17:00",
};

const WEEKDAYS: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKEND: WeekdayKey[] = ["sat", "sun"];

/** Construit les disponibilités hebdo depuis le formulaire d'installation. */
export function buildWorkHoursFromSetup(input: SetupAvailabilityInput): WorkHours {
  const weekdayConfig: WorkDayConfig = {
    enabled: input.weekdaysEnabled,
    start: input.morningStart,
    end: input.afternoonEnd,
    breakStart: input.morningEnd,
    breakEnd: input.afternoonStart,
  };

  const weekendConfig: WorkDayConfig = {
    enabled: false,
    start: "09:00",
    end: "12:00",
  };

  const hours = {} as WorkHours;
  for (const key of WEEKDAYS) hours[key] = { ...weekdayConfig };
  for (const key of WEEKEND) hours[key] = { ...weekendConfig };
  return hours;
}
