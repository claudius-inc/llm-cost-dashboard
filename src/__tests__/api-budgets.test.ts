import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase, getAllProjects } from '@/lib/db';
import { GET, POST } from '@/app/api/budgets/route';
import { NextRequest } from 'next/server';

function makeRequest(
  params: Record<string, string> = {},
  init?: { method?: string; body?: any }
): NextRequest {
  const url = new URL('http://localhost:3000/api/budgets');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  if (init?.body) {
    return new NextRequest(url, {
      method: init.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(init.body),
    });
  }
  return new NextRequest(url);
}

beforeAll(() => seedDatabase());

describe('GET /api/budgets', () => {
  it('returns all budgets as array', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const budgets = await res.json();
    expect(Array.isArray(budgets)).toBe(true);
    expect(budgets.length).toBeGreaterThanOrEqual(7);
  });

  it('each budget has expected fields', async () => {
    const res = await GET(makeRequest());
    const budgets = await res.json();
    const b = budgets[0];
    expect(b).toHaveProperty('id');
    expect(b).toHaveProperty('monthly_limit');
    expect(b).toHaveProperty('alert_threshold');
    expect(b).toHaveProperty('is_active');
  });

  it('includes global budget (null project_id)', async () => {
    const res = await GET(makeRequest());
    const budgets = await res.json();
    const global = budgets.find((b: any) => b.project_id === null && b.provider === null);
    expect(global).toBeDefined();
    expect(global.monthly_limit).toBe(3000);
  });

  it('includes provider-specific budgets', async () => {
    const res = await GET(makeRequest());
    const budgets = await res.json();
    const providerBudgets = budgets.filter(
      (b: any) => b.provider !== null && b.project_id === null
    );
    expect(providerBudgets.length).toBe(3); // openai, anthropic, google
    const providers = providerBudgets.map((b: any) => b.provider);
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers).toContain('google');
  });
});

describe('GET /api/budgets?alerts=true', () => {
  it('returns alerts array', async () => {
    const res = await GET(makeRequest({ alerts: 'true' }));
    expect(res.status).toBe(200);
    const alerts = await res.json();
    expect(Array.isArray(alerts)).toBe(true);
    // Each alert (if any) should have correct shape
    if (alerts.length > 0) {
      const a = alerts[0];
      expect(a).toHaveProperty('budget_id');
      expect(a).toHaveProperty('current_spend');
      expect(a).toHaveProperty('budget_limit');
      expect(a).toHaveProperty('percentage');
      expect(a).toHaveProperty('triggered_at');
      expect(a).toHaveProperty('acknowledged');
    }
  });
});

describe('POST /api/budgets', () => {
  it('creates a new budget', async () => {
    const projects = getAllProjects();
    const res = await POST(
      makeRequest({}, {
        method: 'POST',
        body: {
          projectId: projects[0].id,
          provider: 'openai',
          monthlyLimit: 500,
          alertThreshold: 0.9,
        },
      })
    );
    expect(res.status).toBe(201);
    const budget = await res.json();
    expect(budget).toHaveProperty('id');
    expect(budget.monthlyLimit).toBe(500);
    expect(budget.alertThreshold).toBe(0.9);
  });

  it('creates global budget with null project/provider', async () => {
    const res = await POST(
      makeRequest({}, {
        method: 'POST',
        body: { monthlyLimit: 5000 },
      })
    );
    expect(res.status).toBe(201);
    const budget = await res.json();
    expect(budget.projectId).toBeNull();
    expect(budget.provider).toBeNull();
  });

  it('defaults alertThreshold to 0.8 if omitted', async () => {
    const res = await POST(
      makeRequest({}, {
        method: 'POST',
        body: { monthlyLimit: 1000 },
      })
    );
    expect(res.status).toBe(201);
    const budget = await res.json();
    expect(budget.alertThreshold).toBe(0.8);
  });
});
