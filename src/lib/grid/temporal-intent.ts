export type GridRecurrence = "daily" | "weekly" | "weekdays" | "weekends" | null;

export type GridTemporalIntent = {
  weekdays: number[];
  relativeDayOffset: 0 | 1 | null;
  startTime: string | null;
  endTime: string | null;
  recurrence: GridRecurrence;
  timeWasInferred: boolean;
  hasTemporalLanguage: boolean;
  summary: string | null;
};

const weekdayPatterns: Array<[RegExp, number]> = [
  [/\bsun(?:day)?s?\b/i, 0],
  [/\bmon(?:day)?s?\b/i, 1],
  [/\btue(?:s|sday)?s?\b/i, 2],
  [/\bwed(?:nesday)?s?\b/i, 3],
  [/\bthu(?:r|rs|rsday)?s?\b/i, 4],
  [/\bfri(?:day)?s?\b/i, 5],
  [/\bsat(?:urday)?s?\b/i, 6],
];

const weekdayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function uniqueSorted(values: number[]) {
  return [...new Set(values)].sort((a, b) => a - b);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function explicitClock(hour: number, minute: number, meridiem?: string | null) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  if (!meridiem) return { hour, minute };
  if (hour < 1 || hour > 12) return null;
  const normalized = hour % 12 + (meridiem === "pm" ? 12 : 0);
  return { hour: normalized, minute };
}

function parseTimeRange(query: string) {
  const match = query.match(/\b(?:from\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until|through)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return { startTime: null, endTime: null, inferred: false };

  const startHourRaw = Number(match[1]);
  const startMinute = Number(match[2] ?? "0");
  const endHourRaw = Number(match[4]);
  const endMinute = Number(match[5] ?? "0");
  const startMeridiem = match[3]?.toLowerCase() ?? null;
  const endMeridiem = match[6]?.toLowerCase() ?? null;

  let start = explicitClock(startHourRaw, startMinute, startMeridiem);
  let end = explicitClock(endHourRaw, endMinute, endMeridiem);
  let inferred = false;

  if (!start || !end) return { startTime: null, endTime: null, inferred: false };

  if (!startMeridiem && !endMeridiem && startHourRaw <= 12 && endHourRaw <= 12) {
    inferred = true;
    if (end.hour < start.hour || (end.hour === start.hour && end.minute <= start.minute)) {
      end = { ...end, hour: end.hour + 12 };
    }
  } else if (!startMeridiem && endMeridiem) {
    inferred = true;
    const sameMeridiem = explicitClock(startHourRaw, startMinute, endMeridiem);
    if (sameMeridiem && (sameMeridiem.hour < end.hour || (sameMeridiem.hour === end.hour && sameMeridiem.minute < end.minute))) {
      start = sameMeridiem;
    }
  } else if (startMeridiem && !endMeridiem) {
    inferred = true;
    const sameMeridiem = explicitClock(endHourRaw, endMinute, startMeridiem);
    if (sameMeridiem && (sameMeridiem.hour > start.hour || (sameMeridiem.hour === start.hour && sameMeridiem.minute > start.minute))) {
      end = sameMeridiem;
    } else if (startMeridiem === "am" && endHourRaw <= 12) {
      end = explicitClock(endHourRaw, endMinute, "pm") ?? end;
    }
  }

  if (end.hour > 23) return { startTime: null, endTime: null, inferred: false };
  if (end.hour < start.hour || (end.hour === start.hour && end.minute <= start.minute)) {
    return { startTime: null, endTime: null, inferred: false };
  }

  return {
    startTime: `${pad(start.hour)}:${pad(start.minute)}`,
    endTime: `${pad(end.hour)}:${pad(end.minute)}`,
    inferred,
  };
}

function parseSingleTime(query: string) {
  const match = query.match(/\b(?:at|around)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!match) return null;
  const clock = explicitClock(Number(match[1]), Number(match[2] ?? "0"), match[3].toLowerCase());
  return clock ? `${pad(clock.hour)}:${pad(clock.minute)}` : null;
}

const weekdayLanguagePattern = /\b(?:every\s+)?(?:sun(?:day)?s?|mon(?:day)?s?|tue(?:s|sday)?s?|wed(?:nesday)?s?|thu(?:r|rs|rsday)?s?|fri(?:day)?s?|sat(?:urday)?s?|weekdays?|weekends?|daily|weekly|today|tomorrow)\b/gi;

export function stripGridTemporalLanguage(rawQuery: string) {
  return rawQuery
    .replace(weekdayLanguagePattern, " ")
    .replace(/\b(?:from\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:-|–|—|to|until|through)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, " ")
    .replace(/\b(?:at|around)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGridTemporalIntent(rawQuery: string): GridTemporalIntent {
  const query = rawQuery.trim().toLowerCase().replace(/\s+/g, " ");
  const weekdays: number[] = [];

  for (const [pattern, weekday] of weekdayPatterns) {
    if (pattern.test(query)) weekdays.push(weekday);
  }
  if (/\bweekdays?\b/.test(query)) weekdays.push(1, 2, 3, 4, 5);
  if (/\bweekends?\b/.test(query)) weekdays.push(0, 6);

  const relativeDayOffset = /\btomorrow\b/.test(query) ? 1 : /\btoday\b/.test(query) ? 0 : null;
  const recurrence: GridRecurrence = /\bdaily\b|\bevery day\b/.test(query)
    ? "daily"
    : /\bweekdays?\b/.test(query)
      ? "weekdays"
      : /\bweekends?\b/.test(query)
        ? "weekends"
        : /\bweekly\b|\bevery\s+(?:sun(?:day)?s?|mon(?:day)?s?|tue(?:s|sday)?s?|wed(?:nesday)?s?|thu(?:r|rs|rsday)?s?|fri(?:day)?s?|sat(?:urday)?s?)\b/.test(query)
          ? "weekly"
          : null;

  const range = parseTimeRange(query);
  const singleTime = range.startTime ? null : parseSingleTime(query);
  const startTime = range.startTime ?? singleTime;
  const endTime = range.endTime;
  const normalizedWeekdays = uniqueSorted(weekdays);
  const hasTemporalLanguage = normalizedWeekdays.length > 0 || relativeDayOffset !== null || Boolean(startTime) || recurrence !== null;

  const summaryParts: string[] = [];
  if (relativeDayOffset === 0) summaryParts.push("today");
  else if (relativeDayOffset === 1) summaryParts.push("tomorrow");
  else if (normalizedWeekdays.length) summaryParts.push(normalizedWeekdays.map((day) => weekdayName[day]).join(", "));
  if (startTime && endTime) summaryParts.push(`${startTime}–${endTime}${range.inferred ? " (interpreted)" : ""}`);
  else if (startTime) summaryParts.push(startTime);
  if (recurrence) summaryParts.push(recurrence);

  return {
    weekdays: normalizedWeekdays,
    relativeDayOffset,
    startTime,
    endTime,
    recurrence,
    timeWasInferred: range.inferred,
    hasTemporalLanguage,
    summary: summaryParts.length ? summaryParts.join(" · ") : null,
  };
}

function localDateTimeValue(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return `${copy.getFullYear()}-${pad(copy.getMonth() + 1)}-${pad(copy.getDate())}T${pad(copy.getHours())}:${pad(copy.getMinutes())}`;
}

export function resolveGridTemporalWindow(intent: GridTemporalIntent, referenceDate = new Date()) {
  if (!intent.startTime) return { startsAt: "", endsAt: "" };
  const target = new Date(referenceDate);
  target.setHours(0, 0, 0, 0);

  if (intent.relativeDayOffset !== null) {
    target.setDate(target.getDate() + intent.relativeDayOffset);
  } else if (intent.weekdays.length) {
    const today = target.getDay();
    const offsets = intent.weekdays.map((weekday) => (weekday - today + 7) % 7);
    target.setDate(target.getDate() + Math.min(...offsets));
  }

  return {
    startsAt: localDateTimeValue(target, intent.startTime),
    endsAt: intent.endTime ? localDateTimeValue(target, intent.endTime) : "",
  };
}
