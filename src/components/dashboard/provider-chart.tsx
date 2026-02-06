"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ProviderBreakdown } from "@/types";
import { getProviderColor, getProviderLabel, formatCurrency } from "@/lib/utils";

interface ProviderChartProps {
  data: ProviderBreakdown[];
}

export function ProviderChart({ data }: ProviderChartProps) {
  const chartData = data.map((d) => ({
    name: getProviderLabel(d.provider),
    value: Math.round(d.totalCost * 100) / 100,
    color: getProviderColor(d.provider),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Spend by Provider</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: any) => [formatCurrency(value), "Cost"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
