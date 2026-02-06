"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DollarSign, Activity, Cpu, TrendingUp } from "lucide-react";
import { SpendOverTimeChart } from "@/components/dashboard/spend-over-time-chart";
import { ProviderBreakdownChart } from "@/components/dashboard/provider-breakdown-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { useDateRange } from "@/hooks/use-date-range";
import { formatCurrency, formatCompactNumber, getProviderLabel, getProviderColor } from "@/lib/utils";
import { PRESET_LABELS } from "@/lib/date-range";

function ProjectDetailContent() {
  const params = useParams();
  const { dateRange, setPreset, setCustomRange, apiQueryString } = useDateRange();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      setData(null);
      fetch(`/api/dashboard?view=project-detail&projectId=${params.id}&${apiQueryString}`)
        .then((r) => r.json())
        .then(setData)
        .catch(console.error);
    }
  }, [params.id, apiQueryString]);

  if (!data) {
    return <div className="animate-pulse text-muted-foreground p-8">Loading project...</div>;
  }

  if (data.error) {
    return <div className="text-red-400 p-8">Project not found</div>;
  }

  const { project, dailySpend, providerBreakdown, modelBreakdown } = data;
  const rangeLabel =
    dateRange.preset === "custom"
      ? "selected range"
      : PRESET_LABELS[dateRange.preset].toLowerCase();

  const totalCost = providerBreakdown.reduce((s: number, p: any) => s + p.total_cost, 0);
  const totalRequests = providerBreakdown.reduce((s: number, p: any) => s + p.request_count, 0);
  const totalInputTokens = providerBreakdown.reduce((s: number, p: any) => s + p.total_input_tokens, 0);
  const totalOutputTokens = providerBreakdown.reduce((s: number, p: any) => s + p.total_output_tokens, 0);
  const avgCostPerReq = totalRequests > 0 ? totalCost / totalRequests : 0;
  const budgetPct = project.monthly_budget ? (totalCost / project.monthly_budget) * 100 : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Project</p>
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
        </div>
        <DateRangePicker
          value={dateRange}
          onPresetSelect={setPreset}
          onCustomSelect={setCustomRange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Spend ({rangeLabel})</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCost)}</p>
          {budgetPct !== null && <p className="text-xs text-muted-foreground mt-1">{budgetPct.toFixed(0)}% of {formatCurrency(project.monthly_budget)} budget</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Requests</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCompactNumber(totalRequests)}</p>
          <p className="text-xs text-muted-foreground mt-1">~{formatCurrency(avgCostPerReq)} avg</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Input Tokens</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCompactNumber(totalInputTokens)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Output Tokens</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCompactNumber(totalOutputTokens)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Daily Spend</h2>
          <SpendOverTimeChart data={dailySpend} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">By Provider</h2>
          <ProviderBreakdownChart data={providerBreakdown} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Model Usage</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Model</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Provider</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cost</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Requests</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Cost/Req</th>
              </tr>
            </thead>
            <tbody>
              {modelBreakdown.map((m: any) => (
                <tr key={`${m.provider}-${m.model}`} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-foreground">{m.model}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getProviderColor(m.provider) }} />
                      <span className="text-muted-foreground">{getProviderLabel(m.provider)}</span>
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 font-mono text-foreground">{formatCurrency(m.total_cost)}</td>
                  <td className="text-right py-3 px-4 text-muted-foreground">{formatCompactNumber(m.request_count)}</td>
                  <td className="text-right py-3 px-4 text-muted-foreground">{formatCurrency(m.avg_cost_per_request)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-muted-foreground p-8">Loading project...</div>}>
      <ProjectDetailContent />
    </Suspense>
  );
}
