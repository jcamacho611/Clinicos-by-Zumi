import { describe, expect, it } from "vitest";
import { parseGridTemporalIntent, resolveGridTemporalWindow, stripGridTemporalLanguage } from "@/lib/grid/temporal-intent";

describe("Grid temporal intent", () => {
  it("structures a weekday and common workday range", () => {
    expect(parseGridTemporalIntent("I need an RN Friday 9-5 in Brooklyn")).toMatchObject({
      weekdays: [5],
      startTime: "09:00",
      endTime: "17:00",
      timeWasInferred: true,
      recurrence: null,
    });
  });

  it("preserves explicit meridiem without inference", () => {
    expect(parseGridTemporalIntent("Need a treatment room Tuesday from 1pm to 6pm")).toMatchObject({
      weekdays: [2],
      startTime: "13:00",
      endTime: "18:00",
      timeWasInferred: false,
    });
  });

  it("recognizes recurring weekday supply without pretending it is a booking", () => {
    expect(parseGridTemporalIntent("I have a room every Monday from 8am to 4pm")).toMatchObject({
      weekdays: [1],
      startTime: "08:00",
      endTime: "16:00",
      recurrence: "weekly",
    });
  });

  it("recognizes weekday and weekend groups", () => {
    expect(parseGridTemporalIntent("available weekdays 8am-4pm").weekdays).toEqual([1, 2, 3, 4, 5]);
    expect(parseGridTemporalIntent("available weekends 10am-2pm").weekdays).toEqual([0, 6]);
  });

  it("resolves tomorrow in the caller's local calendar", () => {
    const reference = new Date(2026, 7, 18, 4, 0, 0);
    const temporal = parseGridTemporalIntent("Need coverage tomorrow 9am-5pm");
    expect(resolveGridTemporalWindow(temporal, reference)).toEqual({
      startsAt: "2026-08-19T09:00",
      endsAt: "2026-08-19T17:00",
    });
  });

  it("resolves the next named weekday without inventing a date at parse time", () => {
    const reference = new Date(2026, 7, 18, 4, 0, 0); // Tuesday
    const temporal = parseGridTemporalIntent("Need coverage Friday 9am-5pm");
    expect(resolveGridTemporalWindow(temporal, reference)).toEqual({
      startsAt: "2026-08-21T09:00",
      endsAt: "2026-08-21T17:00",
    });
  });

  it("removes temporal language from marketplace text search", () => {
    expect(stripGridTemporalLanguage("I need an RN Friday 9-5 in Brooklyn")).toBe("I need an RN in Brooklyn");
  });

  it("does not invent a time when the request only names a day", () => {
    expect(parseGridTemporalIntent("I need an RN Friday")).toMatchObject({
      weekdays: [5],
      startTime: null,
      endTime: null,
    });
  });
});
