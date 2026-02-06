import { NextRequest, NextResponse } from "next/server";
import {
  seedDatabase,
  getAllProjects,
  getProject,
  getProjectBreakdown,
  getProviderBreakdown,
  getDailySpend,
  getMonthlySpend,
  getTotalRequests,
  getModelBreakdown,
  getAllBudgets,
  getBudgetAlerts,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  seedDatabase();

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "overview";
  const projectId = searchParams.get("projectId") || undefined;
  const days = parseInt(searchParams.get("days") || "30");
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  if (view === "overview") {
    const thisMonth = getMonthlySpend(0);
    const lastMonth = getMonthlySpend(1);
    const totalRequests = getTotalRequests(days, startDate, endDate);
    const projects = getProjectBreakdown(days, startDate, endDate);
    const activeProjects = projects.filter((p: any) => p.total_cost > 0).length;
    const alerts = getBudgetAlerts();
    const monthChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return NextResponse.json({
      stats: {
        totalSpendThisMonth: thisMonth,
        monthOverMonthChange: Math.round(monthChange * 10) / 10,
        totalRequests,
        averageCostPerRequest: totalRequests > 0 ? thisMonth / totalRequests : 0,
        activeProjects,
        activeBudgetAlerts: alerts.length,
      },
      dailySpend: getDailySpend(days, undefined, undefined, startDate, endDate),
      providerBreakdown: getProviderBreakdown(days, undefined, startDate, endDate),
      projectSummaries: projects,
      budgetAlerts: alerts,
    });
  }

  if (view === "projects") {
    return NextResponse.json({
      projects: getProjectBreakdown(days, startDate, endDate),
      dailySpend: getDailySpend(days, undefined, undefined, startDate, endDate),
      providerBreakdown: getProviderBreakdown(days, undefined, startDate, endDate),
      monthlySpend: getMonthlySpend(0),
    });
  }

  if (view === "project-detail" && projectId) {
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({
      project,
      dailySpend: getDailySpend(days, projectId, undefined, startDate, endDate),
      providerBreakdown: getProviderBreakdown(days, projectId, startDate, endDate),
      modelBreakdown: getModelBreakdown(days, projectId, startDate, endDate),
      monthlySpend: getMonthlySpend(0),
    });
  }

  if (view === "providers") {
    return NextResponse.json({
      providerBreakdown: getProviderBreakdown(days, undefined, startDate, endDate),
      dailySpend: getDailySpend(days, undefined, undefined, startDate, endDate),
      modelBreakdown: getModelBreakdown(days, undefined, startDate, endDate),
    });
  }

  if (view === "budgets") {
    return NextResponse.json({
      budgets: getAllBudgets(),
      alerts: getBudgetAlerts(),
      projects: getAllProjects(),
      monthlySpend: getMonthlySpend(0),
      providerBreakdown: getProviderBreakdown(days, undefined, startDate, endDate),
      projectBreakdown: getProjectBreakdown(days, startDate, endDate),
    });
  }

  return NextResponse.json({ error: "Invalid view" }, { status: 400 });
}
