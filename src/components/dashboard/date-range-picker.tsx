"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DateRange,
  DateRangePreset,
  PRESET_LABELS,
  isValidDateStr,
  formatDateISO,
} from "@/lib/date-range";

interface DateRangePickerProps {
  value: DateRange;
  onPresetSelect: (preset: Exclude<DateRangePreset, "custom">) => void;
  onCustomSelect: (startDate: string, endDate: string) => void;
}

const PRESETS: Exclude<DateRangePreset, "custom">[] = ["7d", "30d", "90d"];

export function DateRangePicker({
  value,
  onPresetSelect,
  onCustomSelect,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustom(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Current display label
  const displayLabel =
    value.preset === "custom"
      ? `${formatLabel(value.startDate)} – ${formatLabel(value.endDate)}`
      : PRESET_LABELS[value.preset];

  function handlePresetClick(preset: Exclude<DateRangePreset, "custom">) {
    onPresetSelect(preset);
    setOpen(false);
    setShowCustom(false);
  }

  function handleCustomApply() {
    if (
      isValidDateStr(customStart) &&
      isValidDateStr(customEnd) &&
      customStart <= customEnd
    ) {
      onCustomSelect(customStart, customEnd);
      setOpen(false);
      setShowCustom(false);
    }
  }

  function handleCustomToggle() {
    setShowCustom(true);
    setCustomStart(value.startDate);
    setCustomEnd(value.endDate);
  }

  return (
    <div ref={ref} className="relative inline-block text-left">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
          "border-border bg-card text-foreground hover:bg-accent hover:text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{displayLabel}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 mt-2 rounded-xl border border-border bg-card shadow-lg shadow-black/20",
            showCustom ? "w-72" : "w-52"
          )}
        >
          {/* Preset options */}
          <div className="p-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  value.preset === preset
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <span>{PRESET_LABELS[preset]}</span>
                {value.preset === preset && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}

            {/* Custom range toggle */}
            <button
              onClick={handleCustomToggle}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                value.preset === "custom"
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <span>Custom range</span>
              {value.preset === "custom" && (
                <Check className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Custom date inputs */}
          {showCustom && (
            <div className="border-t border-border p-3 space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || formatDateISO(new Date())}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "[color-scheme:dark]"
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={formatDateISO(new Date())}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "[color-scheme:dark]"
                  )}
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={
                  !isValidDateStr(customStart) ||
                  !isValidDateStr(customEnd) ||
                  customStart > customEnd
                }
                className={cn(
                  "w-full rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors",
                  "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Format a YYYY-MM-DD string to a short human-readable label */
function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
