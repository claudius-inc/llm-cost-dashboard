"use client";

import { Suspense, useEffect, useState } from "react";
import { Wallet, ShieldCheck, AlertTriangle } from "lucide-react";
import { BudgetAlertCard } from "@/components/ui/budget-alert-card";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import { useDateRange } from "@/hooks/use-date-range";
import { formatCurrency, getProviderLabel } from "@/lib/utils";

function BudgetsContent() {
  const { dateRange, setPreset, setCustomRange, apiQueryString } = useDateRange();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/dashboard?view=budgets&${apiQueryString}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [apiQueryString]);

  if (!data) {
    return <div className="animate-pulse text-muted-foreground p-8">Loading budgets...</div>;
  }

  const { budgets, alerts, projects, providerBreakdown, projectBreakdown } = data;

  const budgetsWithSpend = budgets.map((budget: any) => {
    let currentSpend = 0;
    let label = "Global Budget";

    if (budget.project_id) {
      const projData = projectBreakdown.find((p: any) => p.id === budget.project_id);
      currentSpend = projData?.total_cost || 0;
      const proj = projects.find((p: any) => p.id === budget.project_id);
      label = proj?.name || "Unknown Project";
    } else if (budget.provider) {
      const provData = providerBreakdown.find((p: any) => p.provider === budget.provider);
      currentSpend = provData?.total_cost || 0;
      label = `${getProviderLabel(budget.provider)} (All Projects)`;
    } else {
      currentSpend = providerBreakdown.reduce((s: number, p: any) => s + p.total_cost, 0);
    }

    const percentage = budget.monthly_limit > 0 ? currentSpend / budget.monthly_limit : 0;
    return { ...budget, currentSpend, percentage, label };
  });

  const activeBudgets = budgetsWithSpend.filter((b: any) => b.is_active);
  const overBudget = activeBudgets.filter((b: any) => b.percentage >= 1.0);
  const nearBudget = activeBudgets.filter((b: any) => b.percentage >= b.alert_threshold && b.percentage < 1.0);
  const healthyBudgets = activeBudgets.filter((b: any) => b.percentage < b.alert_threshold);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor spending limits and budget alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton type="budgets" dateRange={dateRange} />
          <DateRangePicker
            value={dateRange}
            onPresetSelect={setPreset}
            onCustomSelect={setCustomRange}
          />
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No budgets configured.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Over Budget</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{overBudget.length}</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Approaching Limit</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{nearBudget.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Healthy</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{healthyBudgets.length}</p>
            </div>
          </div>

          {(overBudget.length > 0 || nearBudget.length > 0) && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Active Alerts</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[...overBudget, ...nearBudget].map((b: any) => (
                  <BudgetAlertCard key={b.id} label={b.label} currentSpend={b.currentSpend} limit={b.monthly_limit} percentage={b.percentage} />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">All Budgets</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Budget</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Limit</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Spend</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Usage</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetsWithSpend.map((b: any) => {
                    const pct = b.percentage * 100;
                    const status = pct >= 100 ? "Over" : pct >= b.alert_threshold * 100 ? "Warning" : "OK";
                    return (
                      <tr key={b.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{b.label}</td>
                        <td className="text-right py-3 px-4 font-mono text-foreground">{formatCurrency(b.monthly_limit)}</td>
                        <td className="text-right py-3 px-4 font-mono text-foreground">{formatCurrency(b.currentSpend)}</td>
                        <td className="text-right py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= b.alert_threshold * 100 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status === "Over" ? "bg-red-500/20 text-red-300" : status === "Warning" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                            {status}
                          </span>
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

export default function BudgetsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-muted-foreground p-8">Loading budgets...</div>}>
      <BudgetsContent />
    </Suspense>
  );
}
