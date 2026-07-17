import { describe, expect, it } from "vitest";
import {
  buildDateTimeLocal,
  parseDateTimeLocal,
  snapTimeToQuarter,
  snapToQuarterHour,
  toLocalDateTimeValue,
} from "./quarterHourUtils";

describe("quarterHourUtils", () => {
  it("snaps to nearest quarter hour", () => {
    expect(snapTimeToQuarter("09:07")).toBe("09:00");
    expect(snapTimeToQuarter("09:08")).toBe("09:15");
    expect(snapTimeToQuarter("23:52")).toBe("23:45");
  });

  it("snaps Date objects", () => {
    const d = new Date(2026, 6, 17, 14, 22, 30);
    const snapped = snapToQuarterHour(d);
    expect(snapped.getHours()).toBe(14);
    expect(snapped.getMinutes()).toBe(15);
    expect(snapped.getSeconds()).toBe(0);
  });

  it("parses and builds datetime-local values", () => {
    const parsed = parseDateTimeLocal("2026-07-17T14:22");
    expect(parsed.date).toBe("2026-07-17");
    expect(parsed.hour).toBe("14");
    expect(parsed.minute).toBe(15);

    expect(buildDateTimeLocal("2026-07-17", "14", 30)).toBe("2026-07-17T14:30");
  });

  it("formats dates for datetime-local inputs", () => {
    const d = new Date(2026, 6, 17, 9, 44);
    expect(toLocalDateTimeValue(d)).toBe("2026-07-17T09:45");
  });
});
