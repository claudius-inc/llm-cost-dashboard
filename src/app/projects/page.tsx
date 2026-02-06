"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, ArrowRight } from "lucide-react";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { useDateRange } from "@/hooks/use-date-range";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { PRESET_LABELS } from "@/lib/date-range";

function ProjectsContent() {
  const { dateRange, setPreset, setCustomRange, apiQueryString } = useDateRange();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/dashboard?view=projects&${apiQueryString}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [apiQueryString]);

  if (!data) {
    return <div className="animate-pulse text-muted-foreground p-8">Loading projects...</div>;
  }

  const { projects } = data;
  const rangeLabel =
    dateRange.preset === "custom"
      ? "selected range"
      : PRESET_LABELS[dateRange.preset].toLowerCase();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">LLM cost breakdown by project</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton type="projects" dateRange={dateRange} />
          <DateRangePicker
            value={dateRange}
            onPresetSelect={setPreset}
            onCustomSelect={setCustomRange}
          />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No projects yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project: any) => {
            const budgetPct = project.monthly_budget
              ? (project.total_cost / project.monthly_budget) * 100
              : null;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatCompactNumber(project.request_count)} requests
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(project.total_cost)}</p>
                    <p className="text-xs text-muted-foreground">{rangeLabel}</p>
                  </div>
                  {budgetPct !== null && (
                    <div className="text-right">
                      <p className={`text-sm font-medium ${budgetPct > 100 ? "text-red-400" : budgetPct > 80 ? "text-amber-400" : "text-emerald-400"}`}>
                        {budgetPct.toFixed(0)}% of budget
                      </p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(project.monthly_budget)}/mo limit</p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-muted-foreground p-8">Loading projects...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
