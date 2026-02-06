'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getProviderColor, getProviderLabel, formatCurrency } from '@/lib/utils';

interface ProviderData {
  provider: string;
  total_cost: number;
  request_count: number;
}

interface ProviderBreakdownChartProps {
  data: ProviderData[];
}

export function ProviderBreakdownChart({ data }: ProviderBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: getProviderLabel(d.provider),
    value: d.total_cost,
    provider: d.provider,
    requests: d.request_count,
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={getProviderColor(entry.provider)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(222 47% 9%)',
            border: '1px solid hsl(217 33% 17%)',
            borderRadius: '8px',
            color: 'hsl(210 40% 96%)',
          }}
          formatter={(value: any, name: any) => [
            `${formatCurrency(value)} (${((value / total) * 100).toFixed(1)}%)`,
            name,
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'hsl(215 20% 55%)' }}
          formatter={(value: any) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
