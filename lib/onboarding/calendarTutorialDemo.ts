import { addDays, addHours, startOfDay, startOfWeek } from "date-fns";

export type CalendarDemoKind = "planning" | "deadline" | "extra" | "event";

export type CalendarDemoEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  kind: CalendarDemoKind;
  location?: string;
};

/** Événements fictifs affichés pendant le tutoriel calendrier (opacité réduite). */
export function buildCalendarTutorialDemoEvents(anchor = new Date()): CalendarDemoEvent[] {
  const monday = startOfWeek(anchor, { weekStartsOn: 1 });

  const slot = (dayOffset: number, startHour: number, durationHours: number) => {
    const start = addHours(addDays(monday, dayOffset), startHour);
    return { start, end: addHours(start, durationHours) };
  };

  return [
    {
      id: "tutorial-demo-brief",
      title: "Brief créatif",
      kind: "planning",
      ...slot(0, 10, 2),
    },
    {
      id: "tutorial-demo-redaction",
      title: "Rédaction posts",
      kind: "planning",
      ...slot(1, 14, 1.5),
    },
    {
      id: "tutorial-demo-deadline",
      title: "Deadline campagne",
      kind: "deadline",
      start: startOfDay(addDays(monday, 2)),
      end: addDays(startOfDay(addDays(monday, 2)), 1),
      allDay: true,
    },
    {
      id: "tutorial-demo-salon",
      title: "Salon professionnel",
      kind: "event",
      start: startOfDay(addDays(monday, 3)),
      end: addDays(startOfDay(addDays(monday, 3)), 1),
      allDay: true,
      location: "Parc des expositions",
    },
    {
      id: "tutorial-demo-point",
      title: "Point client",
      kind: "extra",
      location: "Visio",
      ...slot(4, 11, 1),
    },
  ];
}

export const CALENDAR_TUTORIAL_EVENT_SUGGESTION = {
  title: "Lancement produit — réunion équipe",
  location: "Salle de réunion / Visio",
  notes: "Ordre du jour : objectifs, planning, prochaines étapes",
};
