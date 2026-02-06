'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ProjectData {
  name: string;
  total_cost: number;
  monthly_budget: number | null;
  request_count: number;
}

interface ProjectComparisonChartProps {
  data: ProjectData[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

export function ProjectComparisonChart({ data }: ProjectComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.name,
    cost: d.total_cost,
    budget: d.monthly_budget,
    requests: d.request_count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
        <XAxis
          dataKey="name"
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
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
          formatter={(value: any, name: any) => {
            if (name === 'cost') return [formatCurrency(value), 'Spend'];
            if (name === 'budget') return [value ? formatCurrency(value) : 'None', 'Budget'];
            return [value, name];
          }}
        />
        <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={50}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
        <Bar dataKey="budget" radius={[6, 6, 0, 0]} maxBarSize={50} fill="hsl(217 33% 25%)" opacity={0.5} />
      </BarChart>
    </ResponsiveContainer>
  );
}
