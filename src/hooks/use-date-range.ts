"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  DateRange,
  DateRangePreset,
  parseDateRangeParams,
  dateRangeFromPreset,
  dateRangeFromCustom,
  dateRangeToParams,
} from "@/lib/date-range";

/**
 * Hook to manage date range state via URL search params.
 * This makes ranges shareable and persistent across navigation.
 */
export function useDateRange() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dateRange = useMemo<DateRange>(
    () => parseDateRangeParams(searchParams),
    [searchParams]
  );

  const setDateRange = useCallback(
    (newRange: DateRange) => {
      const params = new URLSearchParams(searchParams.toString());
      // Clear old range params
      params.delete("range");
      params.delete("startDate");
      params.delete("endDate");
      // Set new
      const rangeParams = dateRangeToParams(newRange);
      for (const [k, v] of Object.entries(rangeParams)) {
        params.set(k, v);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const setPreset = useCallback(
    (preset: Exclude<DateRangePreset, "custom">) => {
      setDateRange(dateRangeFromPreset(preset));
    },
    [setDateRange]
  );

  const setCustomRange = useCallback(
    (startDate: string, endDate: string) => {
      setDateRange(dateRangeFromCustom(startDate, endDate));
    },
    [setDateRange]
  );

  /** Build API query string fragment for this range */
  const apiQueryString = useMemo(() => {
    const parts = [`days=${dateRange.days}`];
    if (dateRange.preset === "custom") {
      parts.push(`startDate=${dateRange.startDate}`);
      parts.push(`endDate=${dateRange.endDate}`);
    }
    return parts.join("&");
  }, [dateRange]);

  return {
    dateRange,
    setDateRange,
    setPreset,
    setCustomRange,
    apiQueryString,
  };
}
