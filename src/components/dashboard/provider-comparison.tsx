"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ProviderBreakdown } from "@/types";
import { getProviderColor, getProviderLabel, formatCurrency, formatCompactNumber } from "@/lib/utils";

interface ProviderComparisonProps {
  data: ProviderBreakdown[];
}

export function ProviderComparison({ data }: ProviderComparisonProps) {
  const chartData = data.map((d) => ({
    provider: getProviderLabel(d.provider),
    cost: Math.round(d.totalCost * 100) / 100,
    requests: d.requestCount,
    inputTokens: d.totalInputTokens,
    outputTokens: d.totalOutputTokens,
    color: getProviderColor(d.provider),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Provider Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="provider"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tickFormatter={(v) => `$${v}`}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: any, name: any) => {
                  if (name === "cost") return [formatCurrency(value), "Cost"];
                  return [formatCompactNumber(value), name];
                }}
              />
              <Legend />
              <Bar dataKey="cost" name="Cost ($)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detail table */}
        <div className="mt-6 space-y-2">
          {data.map((d) => (
            <div
              key={d.provider}
              className="grid grid-cols-5 gap-4 text-sm items-center py-2 px-3 rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: getProviderColor(d.provider) }}
                />
                <span className="font-medium">{getProviderLabel(d.provider)}</span>
              </div>
              <div className="text-right font-mono">{formatCurrency(d.totalCost)}</div>
              <div className="text-right text-muted-foreground">
                {formatCompactNumber(d.requestCount)} reqs
              </div>
              <div className="text-right text-muted-foreground">
                {formatCompactNumber(d.totalInputTokens)} in
              </div>
              <div className="text-right text-muted-foreground">
                {formatCompactNumber(d.totalOutputTokens)} out
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
