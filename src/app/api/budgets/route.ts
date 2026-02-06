import { NextRequest, NextResponse } from 'next/server';
import { getAllBudgets, createBudget, getBudgetAlerts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertsOnly = searchParams.get('alerts') === 'true';

    if (alertsOnly) {
      const alerts = getBudgetAlerts();
      return NextResponse.json(alerts);
    }

    const budgets = getAllBudgets();
    return NextResponse.json(budgets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const budget = createBudget({
      projectId: body.projectId || null,
      provider: body.provider || null,
      monthlyLimit: body.monthlyLimit,
      alertThreshold: body.alertThreshold || 0.8,
    });
    return NextResponse.json(budget, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
