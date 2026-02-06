"use client";

import { Download } from "lucide-react";
import type { DateRange } from "@/lib/date-range";

interface ExportCsvButtonProps {
  type: "usage" | "projects" | "budgets";
  dateRange: DateRange;
}

export function ExportCsvButton({ type, dateRange }: ExportCsvButtonProps) {
  const params = new URLSearchParams();
  params.set("type", type);

  if (dateRange.preset === "custom") {
    params.set("range", "custom");
    params.set("startDate", dateRange.startDate);
    params.set("endDate", dateRange.endDate);
  } else {
    params.set("range", dateRange.preset);
  }

  const href = `/api/export?${params.toString()}`;

  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      title={`Export ${type} as CSV`}
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </a>
  );
}
