'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getProviderColor, getProviderLabel } from '@/lib/utils';

interface DailyRecord {
  date: string;
  cost: number;
  provider: string;
}

interface SpendOverTimeChartProps {
  data: DailyRecord[];
  providers?: string[];
}

export function SpendOverTimeChart({ data, providers }: SpendOverTimeChartProps) {
  const chartData = useMemo(() => {
    // Pivot: each date becomes a row with provider columns
    const dateMap = new Map<string, Record<string, any>>();
    const allProviders = new Set<string>();

    for (const row of data) {
      allProviders.add(row.provider);
      const existing: Record<string, any> = dateMap.get(row.date) || { date: row.date };
      existing[row.provider] = ((existing[row.provider] as number) || 0) + row.cost;
      dateMap.set(row.date, existing);
    }

    const sorted = Array.from(dateMap.values()).sort((a, b) =>
      (a.date as string).localeCompare(b.date as string)
    );
    return { rows: sorted, providers: providers || Array.from(allProviders) };
  }, [data, providers]);

  if (chartData.rows.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        No data available. Seed demo data to get started.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData.rows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          {chartData.providers.map((p) => (
            <linearGradient key={p} id={`gradient-${p}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={getProviderColor(p)} stopOpacity={0.3} />
              <stop offset="95%" stopColor={getProviderColor(p)} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          tickFormatter={(v: string) => {
            const d = new Date(v + 'T00:00:00');
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
          stroke="hsl(217 33% 17%)"
        />
        <YAxis
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          stroke="hsl(217 33% 17%)"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(222 47% 9%)',
            border: '1px solid hsl(217 33% 17%)',
            borderRadius: '8px',
            color: 'hsl(210 40% 96%)',
          }}
          formatter={(value: any, name: any) => [`$${value.toFixed(4)}`, getProviderLabel(name)]}
          labelFormatter={(label: any) => {
            const d = new Date(label + 'T00:00:00');
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          }}
        />
        <Legend
          formatter={(value: any) => getProviderLabel(value)}
          wrapperStyle={{ fontSize: 12, color: 'hsl(215 20% 55%)' }}
        />
        {chartData.providers.map((p) => (
          <Area
            key={p}
            type="monotone"
            dataKey={p}
            stackId="1"
            stroke={getProviderColor(p)}
            fill={`url(#gradient-${p})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
