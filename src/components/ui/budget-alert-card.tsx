import { cn, formatCurrency } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface BudgetAlertCardProps {
  label: string;
  currentSpend: number;
  limit: number;
  percentage: number;
  acknowledged?: boolean;
}

export function BudgetAlertCard({ label, currentSpend, limit, percentage, acknowledged }: BudgetAlertCardProps) {
  const severity = percentage >= 1.0 ? 'critical' : percentage >= 0.9 ? 'warning' : 'info';
  const pctDisplay = Math.round(percentage * 100);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        severity === 'critical' && 'border-red-500/50 bg-red-500/5',
        severity === 'warning' && 'border-amber-500/50 bg-amber-500/5',
        severity === 'info' && 'border-blue-500/50 bg-blue-500/5',
        acknowledged && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {severity === 'critical' ? (
            <XCircle className="h-5 w-5 text-red-400" />
          ) : severity === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          ) : (
            <CheckCircle className="h-5 w-5 text-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">{label}</p>
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                severity === 'critical' && 'bg-red-500/20 text-red-300',
                severity === 'warning' && 'bg-amber-500/20 text-amber-300',
                severity === 'info' && 'bg-blue-500/20 text-blue-300'
              )}
            >
              {pctDisplay}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(currentSpend)} / {formatCurrency(limit)}
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                severity === 'critical' && 'bg-red-500',
                severity === 'warning' && 'bg-amber-500',
                severity === 'info' && 'bg-blue-500'
              )}
              style={{ width: `${Math.min(pctDisplay, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
