"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { BudgetAlert } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface BudgetAlertsProps {
  alerts: BudgetAlert[];
  onAcknowledge?: (id: string) => void;
}

export function BudgetAlerts({ alerts, onAcknowledge }: BudgetAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Budget Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">All budgets are within limits. Looking good! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Budget Alerts
          <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={alert.percentage > 1 ? "destructive" : "warning"}>
                    {(alert.percentage * 100).toFixed(0)}%
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatCurrency(alert.currentSpend)} / {formatCurrency(alert.limit)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Triggered {new Date(alert.triggeredAt).toLocaleDateString()}
                </p>
              </div>
              {onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
