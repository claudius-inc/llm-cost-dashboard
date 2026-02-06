/**
 * Date range utilities for the dashboard.
 * Handles preset ranges, custom ranges, and URL param serialization.
 */

export type DateRangePreset = "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
}

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};

export const PRESET_DAYS: Record<Exclude<DateRangePreset, "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/** Format a Date to YYYY-MM-DD */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Get a date N days ago from reference (default: today) */
export function daysAgoISO(n: number, from?: Date): string {
  const d = from ? new Date(from) : new Date();
  d.setDate(d.getDate() - n);
  return formatDateISO(d);
}

/** Compute the full DateRange from a preset */
export function dateRangeFromPreset(preset: Exclude<DateRangePreset, "custom">): DateRange {
  const days = PRESET_DAYS[preset];
  return {
    preset,
    startDate: daysAgoISO(days),
    endDate: formatDateISO(new Date()),
    days,
  };
}

/** Compute DateRange from custom start/end strings */
export function dateRangeFromCustom(startDate: string, endDate: string): DateRange {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diffMs = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return { preset: "custom", startDate, endDate, days };
}

/** Validate a YYYY-MM-DD date string */
export function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00");
  return !isNaN(d.getTime());
}

/** Parse URL search params into a DateRange (with fallback to 30d) */
export function parseDateRangeParams(params: URLSearchParams): DateRange {
  const range = params.get("range") as DateRangePreset | null;
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");

  // Custom range with valid dates
  if (
    range === "custom" &&
    startDate &&
    endDate &&
    isValidDateStr(startDate) &&
    isValidDateStr(endDate)
  ) {
    return dateRangeFromCustom(startDate, endDate);
  }

  // Preset range
  if (range && range !== "custom" && range in PRESET_DAYS) {
    return dateRangeFromPreset(range as Exclude<DateRangePreset, "custom">);
  }

  // Fallback: 30 days
  return dateRangeFromPreset("30d");
}

/** Serialize a DateRange to URL search params */
export function dateRangeToParams(range: DateRange): Record<string, string> {
  if (range.preset === "custom") {
    return { range: "custom", startDate: range.startDate, endDate: range.endDate };
  }
  return { range: range.preset };
}
