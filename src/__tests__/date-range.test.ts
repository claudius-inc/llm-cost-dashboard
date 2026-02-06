import { describe, it, expect } from "vitest";
import {
  formatDateISO,
  daysAgoISO,
  dateRangeFromPreset,
  dateRangeFromCustom,
  isValidDateStr,
  parseDateRangeParams,
  dateRangeToParams,
  PRESET_LABELS,
  PRESET_DAYS,
} from "@/lib/date-range";

describe("formatDateISO", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const d = new Date("2024-03-15T12:00:00Z");
    expect(formatDateISO(d)).toBe("2024-03-15");
  });

  it("pads single-digit months and days", () => {
    const d = new Date("2024-01-05T00:00:00Z");
    expect(formatDateISO(d)).toBe("2024-01-05");
  });
});

describe("daysAgoISO", () => {
  it("returns a date N days before the reference", () => {
    const ref = new Date("2024-06-15T12:00:00Z");
    expect(daysAgoISO(7, ref)).toBe("2024-06-08");
    expect(daysAgoISO(30, ref)).toBe("2024-05-16");
  });

  it("returns today when 0 days ago", () => {
    const ref = new Date("2024-06-15T12:00:00Z");
    expect(daysAgoISO(0, ref)).toBe("2024-06-15");
  });
});

describe("isValidDateStr", () => {
  it("accepts valid YYYY-MM-DD strings", () => {
    expect(isValidDateStr("2024-01-01")).toBe(true);
    expect(isValidDateStr("2024-12-31")).toBe(true);
    expect(isValidDateStr("2023-06-15")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidDateStr("2024/01/01")).toBe(false);
    expect(isValidDateStr("01-01-2024")).toBe(false);
    expect(isValidDateStr("not-a-date")).toBe(false);
    expect(isValidDateStr("")).toBe(false);
    expect(isValidDateStr("2024-13-01")).toBe(false); // month 13
  });
});

describe("dateRangeFromPreset", () => {
  it("creates correct range for 7d", () => {
    const range = dateRangeFromPreset("7d");
    expect(range.preset).toBe("7d");
    expect(range.days).toBe(7);
    expect(range.endDate).toBe(formatDateISO(new Date()));
    // startDate should be ~7 days ago
    const start = new Date(range.startDate + "T00:00:00");
    const end = new Date(range.endDate + "T00:00:00");
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it("creates correct range for 30d", () => {
    const range = dateRangeFromPreset("30d");
    expect(range.preset).toBe("30d");
    expect(range.days).toBe(30);
  });

  it("creates correct range for 90d", () => {
    const range = dateRangeFromPreset("90d");
    expect(range.preset).toBe("90d");
    expect(range.days).toBe(90);
  });
});

describe("dateRangeFromCustom", () => {
  it("computes correct days for a custom range", () => {
    const range = dateRangeFromCustom("2024-01-01", "2024-01-15");
    expect(range.preset).toBe("custom");
    expect(range.startDate).toBe("2024-01-01");
    expect(range.endDate).toBe("2024-01-15");
    expect(range.days).toBe(14);
  });

  it("handles single-day range", () => {
    const range = dateRangeFromCustom("2024-06-15", "2024-06-15");
    expect(range.days).toBe(1); // minimum 1
  });
});

describe("parseDateRangeParams", () => {
  it("parses preset range from URL params", () => {
    const params = new URLSearchParams("range=7d");
    const range = parseDateRangeParams(params);
    expect(range.preset).toBe("7d");
    expect(range.days).toBe(7);
  });

  it("parses custom range from URL params", () => {
    const params = new URLSearchParams(
      "range=custom&startDate=2024-01-01&endDate=2024-01-31"
    );
    const range = parseDateRangeParams(params);
    expect(range.preset).toBe("custom");
    expect(range.startDate).toBe("2024-01-01");
    expect(range.endDate).toBe("2024-01-31");
    expect(range.days).toBe(30);
  });

  it("falls back to 30d for missing params", () => {
    const params = new URLSearchParams();
    const range = parseDateRangeParams(params);
    expect(range.preset).toBe("30d");
    expect(range.days).toBe(30);
  });

  it("falls back to 30d for invalid preset", () => {
    const params = new URLSearchParams("range=999d");
    const range = parseDateRangeParams(params);
    expect(range.preset).toBe("30d");
  });

  it("falls back to 30d for custom with missing dates", () => {
    const params = new URLSearchParams("range=custom&startDate=2024-01-01");
    const range = parseDateRangeParams(params);
    expect(range.preset).toBe("30d");
  });

  it("falls back to 30d for custom with invalid dates", () => {
    const params = new URLSearchParams(
      "range=custom&startDate=not-valid&endDate=2024-01-31"
    );
    const range = parseDateRangeParams(params);
    expect(range.preset).toBe("30d");
  });
});

describe("dateRangeToParams", () => {
  it("serializes preset range", () => {
    const range = dateRangeFromPreset("7d");
    const params = dateRangeToParams(range);
    expect(params).toEqual({ range: "7d" });
  });

  it("serializes custom range with dates", () => {
    const range = dateRangeFromCustom("2024-01-01", "2024-01-31");
    const params = dateRangeToParams(range);
    expect(params).toEqual({
      range: "custom",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    });
  });
});

describe("PRESET_LABELS and PRESET_DAYS", () => {
  it("has labels for all presets", () => {
    expect(PRESET_LABELS["7d"]).toBe("Last 7 days");
    expect(PRESET_LABELS["30d"]).toBe("Last 30 days");
    expect(PRESET_LABELS["90d"]).toBe("Last 90 days");
    expect(PRESET_LABELS["custom"]).toBe("Custom range");
  });

  it("has days for non-custom presets", () => {
    expect(PRESET_DAYS["7d"]).toBe(7);
    expect(PRESET_DAYS["30d"]).toBe(30);
    expect(PRESET_DAYS["90d"]).toBe(90);
  });
});
