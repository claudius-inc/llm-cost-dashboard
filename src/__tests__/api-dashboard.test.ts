import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase } from '@/lib/db';
import { GET } from '@/app/api/dashboard/route';
import { NextRequest } from 'next/server';

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/dashboard');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

// Dashboard route calls seedDatabase() internally, but we seed once for stable state
beforeAll(() => seedDatabase());

describe('GET /api/dashboard — overview (default)', () => {
  it('returns 200 with expected shape', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('dailySpend');
    expect(body).toHaveProperty('providerBreakdown');
    expect(body).toHaveProperty('projectSummaries');
    expect(body).toHaveProperty('budgetAlerts');
  });

  it('stats contains all required fields', async () => {
    const res = await GET(makeRequest());
    const { stats } = await res.json();
    expect(stats).toHaveProperty('totalSpendThisMonth');
    expect(stats).toHaveProperty('monthOverMonthChange');
    expect(stats).toHaveProperty('totalRequests');
    expect(stats).toHaveProperty('averageCostPerRequest');
    expect(stats).toHaveProperty('activeProjects');
    expect(stats).toHaveProperty('activeBudgetAlerts');
    expect(typeof stats.totalSpendThisMonth).toBe('number');
    expect(typeof stats.totalRequests).toBe('number');
  });

  it('dailySpend is an array of date/cost objects', async () => {
    const res = await GET(makeRequest());
    const { dailySpend } = await res.json();
    expect(Array.isArray(dailySpend)).toBe(true);
    if (dailySpend.length > 0) {
      expect(dailySpend[0]).toHaveProperty('date');
      expect(dailySpend[0]).toHaveProperty('cost');
    }
  });

  it('providerBreakdown contains provider rows', async () => {
    const res = await GET(makeRequest());
    const { providerBreakdown } = await res.json();
    expect(providerBreakdown.length).toBeGreaterThan(0);
    const providers = providerBreakdown.map((p: any) => p.provider);
    expect(providers).toContain('openai');
  });
});

describe('GET /api/dashboard — projects view', () => {
  it('returns projects and spend data', async () => {
    const res = await GET(makeRequest({ view: 'projects' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('projects');
    expect(body).toHaveProperty('dailySpend');
    expect(body).toHaveProperty('providerBreakdown');
    expect(body).toHaveProperty('monthlySpend');
    expect(Array.isArray(body.projects)).toBe(true);
  });
});

describe('GET /api/dashboard — providers view', () => {
  it('returns provider breakdown and model breakdown', async () => {
    const res = await GET(makeRequest({ view: 'providers' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('providerBreakdown');
    expect(body).toHaveProperty('dailySpend');
    expect(body).toHaveProperty('modelBreakdown');
  });
});

describe('GET /api/dashboard — budgets view', () => {
  it('returns budgets, alerts, and related data', async () => {
    const res = await GET(makeRequest({ view: 'budgets' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('budgets');
    expect(body).toHaveProperty('alerts');
    expect(body).toHaveProperty('projects');
    expect(body).toHaveProperty('monthlySpend');
    expect(body).toHaveProperty('providerBreakdown');
    expect(body).toHaveProperty('projectBreakdown');
  });
});

describe('GET /api/dashboard — invalid view', () => {
  it('returns 400 for unknown view', async () => {
    const res = await GET(makeRequest({ view: 'nonexistent' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('GET /api/dashboard — days param', () => {
  it('respects custom days parameter', async () => {
    const res7 = await GET(makeRequest({ days: '7' }));
    const res90 = await GET(makeRequest({ days: '90' }));
    const body7 = await res7.json();
    const body90 = await res90.json();
    // 90-day window should have at least as many daily spend entries as 7-day
    expect(body90.dailySpend.length).toBeGreaterThanOrEqual(body7.dailySpend.length);
  });
});
