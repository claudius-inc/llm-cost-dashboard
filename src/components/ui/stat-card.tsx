import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number; // percentage change
  icon?: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, subtitle, change, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconColor || 'bg-primary/10')}>
            <Icon className={cn('h-5 w-5', iconColor ? 'text-foreground' : 'text-primary')} />
          </div>
        )}
      </div>
      {(subtitle || change !== undefined) && (
        <div className="mt-3 flex items-center gap-2">
          {change !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                change > 0 ? 'text-red-400' : change < 0 ? 'text-emerald-400' : 'text-muted-foreground'
              )}
            >
              {change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : change < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
