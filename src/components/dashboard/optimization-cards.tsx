"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowDownCircle, Database, FileText, Shuffle, Layers } from "lucide-react";
import type { CostOptimization } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

const typeIcons: Record<CostOptimization["type"], typeof Lightbulb> = {
  "model-downgrade": ArrowDownCircle,
  caching: Database,
  "prompt-optimization": FileText,
  "batch-requests": Layers,
  "provider-switch": Shuffle,
};

const impactColors: Record<CostOptimization["impact"], string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
};

interface OptimizationCardsProps {
  optimizations: CostOptimization[];
}

export function OptimizationCards({ optimizations }: OptimizationCardsProps) {
  if (optimizations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Cost Optimizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No optimizations detected. Your usage looks efficient!</p>
        </CardContent>
      </Card>
    );
  }

  const totalSavings = optimizations.reduce((s, o) => s + o.estimatedSavings, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Cost Optimizations
          </CardTitle>
          <Badge variant="success">
            Potential savings: {formatCurrency(totalSavings)}/mo
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {optimizations.map((opt) => {
            const Icon = typeIcons[opt.type] || Lightbulb;
            return (
              <div key={opt.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{opt.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("text-xs", impactColors[opt.impact])}>
                      {opt.impact}
                    </Badge>
                    <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(opt.estimatedSavings)}/mo
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{opt.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
