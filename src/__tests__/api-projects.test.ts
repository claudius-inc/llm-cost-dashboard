import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase } from '@/lib/db';
import { GET, POST } from '@/app/api/projects/route';
import { NextRequest } from 'next/server';

function makeRequest(
  params: Record<string, string> = {},
  init?: { method?: string; body?: any }
): NextRequest {
  const url = new URL('http://localhost:3000/api/projects');
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

describe('GET /api/projects', () => {
  it('returns all projects as array', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const projects = await res.json();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBe(4);
  });

  it('each project has expected fields', async () => {
    const res = await GET(makeRequest());
    const projects = await res.json();
    const p = projects[0];
    expect(p).toHaveProperty('id');
    expect(p).toHaveProperty('name');
    expect(p).toHaveProperty('description');
    expect(p).toHaveProperty('created_at');
    expect(p).toHaveProperty('monthly_budget');
    expect(p).toHaveProperty('is_active');
  });

  it('returns project breakdown with stats=true', async () => {
    const res = await GET(makeRequest({ stats: 'true' }));
    expect(res.status).toBe(200);
    const breakdown = await res.json();
    expect(Array.isArray(breakdown)).toBe(true);
    expect(breakdown.length).toBe(4);
    breakdown.forEach((p: any) => {
      expect(p).toHaveProperty('total_cost');
      expect(p).toHaveProperty('request_count');
    });
  });

  it('stats=false (or absent) returns raw projects, not breakdown', async () => {
    const res = await GET(makeRequest({ stats: 'false' }));
    const projects = await res.json();
    // Raw projects don't have total_cost
    expect(projects[0]).not.toHaveProperty('total_cost');
    expect(projects[0]).toHaveProperty('name');
  });
});

describe('POST /api/projects', () => {
  it('creates a new project', async () => {
    const res = await POST(
      makeRequest({}, {
        method: 'POST',
        body: { name: 'New API Project', description: 'Test project', monthlyBudget: 250 },
      })
    );
    expect(res.status).toBe(201);
    const project = await res.json();
    expect(project).toHaveProperty('id');
    expect(project.name).toBe('New API Project');
    expect(project.monthlyBudget).toBe(250);
  });

  it('creates project without optional fields', async () => {
    const res = await POST(
      makeRequest({}, {
        method: 'POST',
        body: { name: 'Minimal Project' },
      })
    );
    expect(res.status).toBe(201);
    const project = await res.json();
    expect(project.name).toBe('Minimal Project');
  });

  it('created project appears in GET', async () => {
    const unique = `Project-${Date.now()}`;
    await POST(
      makeRequest({}, { method: 'POST', body: { name: unique } })
    );
    const res = await GET(makeRequest());
    const projects = await res.json();
    const names = projects.map((p: any) => p.name);
    expect(names).toContain(unique);
  });
});
