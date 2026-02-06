"use client";

import { Suspense, useEffect, useState } from "react";
import { Server } from "lucide-react";
import { SpendOverTimeChart } from "@/components/dashboard/spend-over-time-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { useDateRange } from "@/hooks/use-date-range";
import { formatCurrency, formatCompactNumber, getProviderColor, getProviderLabel } from "@/lib/utils";

function ProvidersContent() {
  const { dateRange, setPreset, setCustomRange, apiQueryString } = useDateRange();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/dashboard?view=providers&${apiQueryString}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [apiQueryString]);

  if (!data) {
    return <div className="animate-pulse text-muted-foreground p-8">Loading providers...</div>;
  }

  const { providerBreakdown: providers, dailySpend, modelBreakdown } = data;
  const totalCost = providers.reduce((s: number, p: any) => s + p.total_cost, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare spending across LLM providers</p>
        </div>
        <DateRangePicker
          value={dateRange}
          onPresetSelect={setPreset}
          onCustomSelect={setCustomRange}
        />
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No data yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {providers.map((p: any) => {
              const pct = totalCost > 0 ? (p.total_cost / totalCost) * 100 : 0;
              return (
                <div key={p.provider} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: getProviderColor(p.provider) + "20" }}>
                      <Server className="h-5 w-5" style={{ color: getProviderColor(p.provider) }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{getProviderLabel(p.provider)}</h3>
                      <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% of total spend</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Cost</span>
                      <span className="text-sm font-mono font-medium text-foreground">{formatCurrency(p.total_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Requests</span>
                      <span className="text-sm font-medium text-foreground">{formatCompactNumber(p.request_count)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Cost/Req</span>
                      <span className="text-sm font-mono font-medium text-foreground">{formatCurrency(p.total_cost / p.request_count)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">Provider Spend Over Time</h2>
            <SpendOverTimeChart data={dailySpend} />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">Model Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Model</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Provider</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Cost</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Requests</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Cost/Req</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {modelBreakdown.map((m: any) => {
                    const share = totalCost > 0 ? (m.total_cost / totalCost) * 100 : 0;
                    return (
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
                        <td className="text-right py-3 px-4 font-mono text-muted-foreground">{formatCurrency(m.avg_cost_per_request)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: getProviderColor(m.provider) }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{share.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-muted-foreground p-8">Loading providers...</div>}>
      <ProvidersContent />
    </Suspense>
  );
}
