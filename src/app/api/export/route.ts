import { NextRequest, NextResponse } from 'next/server';
import { toCsv } from '@/lib/csv';
import {
  seedDatabase,
  getUsageRecords,
  getProjectBreakdown,
  getAllBudgets,
  getProviderBreakdown,
  getAllProjects,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Map range preset to number of days */
function rangeToDays(range: string): number {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 30;
  }
}

/** Compute startDate/endDate from range or custom params */
function resolveDates(params: URLSearchParams): { days: number; startDate?: string; endDate?: string } {
  const range = params.get('range') || '30d';
  const from = params.get('from') || params.get('startDate');
  const to = params.get('to') || params.get('endDate');

  if (range === 'custom' && from && to) {
    const start = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    const diffMs = end.getTime() - start.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { days, startDate: from, endDate: to };
  }

  const days = rangeToDays(range);
  return { days };
}

function buildUsageCsv(days: number, startDate?: string, endDate?: string): string {
  const records = getUsageRecords({
    startDate,
    endDate,
    limit: 50000,
  });

  // If no custom dates, filter by days manually
  const cutoff = startDate ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filtered = cutoff
    ? records.filter(r => new Date(r.timestamp) >= cutoff)
    : records;

  const headers = ['ID', 'Project ID', 'Provider', 'Model', 'Input Tokens', 'Output Tokens', 'Cost', 'Timestamp'];
  const rows = filtered.map((r: any) => [
    r.id,
    r.project_id,
    r.provider,
    r.model,
    r.input_tokens,
    r.output_tokens,
    r.cost,
    r.timestamp,
  ]);

  return toCsv(headers, rows);
}

function buildProjectsCsv(days: number, startDate?: string, endDate?: string): string {
  const projects = getProjectBreakdown(days, startDate, endDate);

  const headers = ['ID', 'Name', 'Monthly Budget', 'Total Cost', 'Request Count'];
  const rows = projects.map((p: any) => [
    p.id,
    p.name,
    p.monthly_budget ?? '',
    p.total_cost,
    p.request_count,
  ]);

  return toCsv(headers, rows);
}

function buildBudgetsCsv(): string {
  const budgets = getAllBudgets();
  const projects = getAllProjects();

  const headers = ['ID', 'Project', 'Provider', 'Monthly Limit', 'Alert Threshold', 'Active'];
  const rows = budgets.map((b: any) => {
    const project = b.project_id
      ? projects.find((p: any) => p.id === b.project_id)
      : null;
    return [
      b.id,
      project ? project.name : (b.project_id || 'Global'),
      b.provider || 'All',
      b.monthly_limit,
      b.alert_threshold,
      b.is_active ? 'Yes' : 'No',
    ];
  });

  return toCsv(headers, rows);
}

export async function GET(request: NextRequest) {
  seedDatabase();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type || !['usage', 'projects', 'budgets'].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid or missing "type" parameter. Must be one of: usage, projects, budgets' },
      { status: 400 }
    );
  }

  const { days, startDate, endDate } = resolveDates(searchParams);

  let csv: string;
  let filename: string;

  switch (type) {
    case 'usage':
      csv = buildUsageCsv(days, startDate, endDate);
      filename = `usage-export-${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'projects':
      csv = buildProjectsCsv(days, startDate, endDate);
      filename = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'budgets':
      csv = buildBudgetsCsv();
      filename = `budgets-export-${new Date().toISOString().split('T')[0]}.csv`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
