"use client";

import { Suspense, useEffect, useState } from "react";
import { DollarSign, Activity, FolderKanban, AlertTriangle, Download } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { ProviderChart } from "@/components/dashboard/provider-chart";
import { ProjectTable } from "@/components/dashboard/project-table";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import { OptimizationCards } from "@/components/dashboard/optimization-cards";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { useDateRange } from "@/hooks/use-date-range";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { PRESET_LABELS } from "@/lib/date-range";

function DashboardContent() {
  const { dateRange, setPreset, setCustomRange, apiQueryString } = useDateRange();
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/dashboard?view=overview&${apiQueryString}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch(console.error);
  }, [apiQueryString]);

  if (!loaded || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const { stats, dailySpend, providerBreakdown, projectSummaries, budgetAlerts } = data;
  const rangeLabel =
    dateRange.preset === "custom"
      ? "selected range"
      : PRESET_LABELS[dateRange.preset].toLowerCase();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track and optimize your LLM API spending across all providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton type="usage" dateRange={dateRange} />
          <DateRangePicker
            value={dateRange}
            onPresetSelect={setPreset}
            onCustomSelect={setCustomRange}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Spend"
          value={formatCurrency(stats.totalSpendThisMonth)}
          icon={DollarSign}
          trend={stats.monthOverMonthChange}
        />
        <StatCard
          title="Total Requests"
          value={formatCompactNumber(stats.totalRequests)}
          description={`Avg ${formatCurrency(stats.averageCostPerRequest)}/request`}
          icon={Activity}
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects.toString()}
          icon={FolderKanban}
        />
        <StatCard
          title="Budget Alerts"
          value={stats.activeBudgetAlerts.toString()}
          description={stats.activeBudgetAlerts > 0 ? "Needs attention" : "All clear"}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendChart data={dailySpend} title={`Daily Spend (${rangeLabel})`} />
        </div>
        <ProviderChart data={providerBreakdown} />
      </div>

      <ProjectTable projects={projectSummaries} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetAlerts alerts={budgetAlerts} />
        <OptimizationCards optimizations={[]} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
