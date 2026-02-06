"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProjectSummary } from "@/types";
import { formatCurrency, getProviderLabel } from "@/lib/utils";

interface ProjectTableProps {
  projects: ProjectSummary[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
            <div className="col-span-3">Project</div>
            <div className="col-span-2 text-right">This Month</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2">Top Provider</div>
            <div className="col-span-2">Budget</div>
            <div className="col-span-1 text-right">Trend</div>
          </div>

          {/* Rows */}
          {projects.map((ps) => (
            <Link
              key={ps.project.id}
              href={`/projects/${ps.project.id}`}
              className="grid grid-cols-12 gap-4 items-center px-2 py-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="col-span-3">
                <p className="font-medium">{ps.project.name}</p>
                <p className="text-xs text-muted-foreground">{ps.project.description}</p>
              </div>
              <div className="col-span-2 text-right font-mono text-sm">
                {formatCurrency(ps.costThisMonth)}
              </div>
              <div className="col-span-2 text-right font-mono text-sm text-muted-foreground">
                {formatCurrency(ps.totalCost)}
              </div>
              <div className="col-span-2">
                {ps.topProvider && (
                  <Badge variant="secondary">{getProviderLabel(ps.topProvider)}</Badge>
                )}
              </div>
              <div className="col-span-2">
                {ps.budgetUsage !== null ? (
                  <div className="space-y-1">
                    <Progress value={ps.budgetUsage * 100} />
                    <p className="text-xs text-muted-foreground">
                      {(ps.budgetUsage * 100).toFixed(0)}% of {formatCurrency(ps.project.monthlyBudget!)}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No budget</span>
                )}
              </div>
              <div className="col-span-1 text-right">
                <span
                  className={
                    ps.trend > 0.05
                      ? "text-red-500 text-sm"
                      : ps.trend < -0.05
                      ? "text-emerald-500 text-sm"
                      : "text-muted-foreground text-sm"
                  }
                >
                  {ps.trend > 0 ? "↑" : ps.trend < 0 ? "↓" : "→"}
                  {Math.abs(ps.trend * 100).toFixed(0)}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
