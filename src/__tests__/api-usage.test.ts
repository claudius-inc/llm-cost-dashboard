import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase, getAllProjects } from '@/lib/db';
import { GET, POST } from '@/app/api/usage/route';
import { NextRequest } from 'next/server';

function makeRequest(
  params: Record<string, string> = {},
  init?: { method?: string; body?: any }
): NextRequest {
  const url = new URL('http://localhost:3000/api/usage');
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

describe('GET /api/usage', () => {
  it('returns array of usage records', async () => {
    const res = await GET(makeRequest({ limit: '5' }));
    expect(res.status).toBe(200);
    const records = await res.json();
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(5);
  });

  it('each record has expected fields', async () => {
    const res = await GET(makeRequest({ limit: '1' }));
    const records = await res.json();
    const r = records[0];
    expect(r).toHaveProperty('id');
    expect(r).toHaveProperty('project_id');
    expect(r).toHaveProperty('provider');
    expect(r).toHaveProperty('model');
    expect(r).toHaveProperty('input_tokens');
    expect(r).toHaveProperty('output_tokens');
    expect(r).toHaveProperty('cost');
    expect(r).toHaveProperty('timestamp');
  });

  it('filters by provider', async () => {
    const res = await GET(makeRequest({ provider: 'anthropic', limit: '20' }));
    const records = await res.json();
    expect(records.length).toBeGreaterThan(0);
    records.forEach((r: any) => expect(r.provider).toBe('anthropic'));
  });

  it('filters by projectId', async () => {
    const projects = getAllProjects();
    const pid = projects[0].id;
    const res = await GET(makeRequest({ projectId: pid, limit: '20' }));
    const records = await res.json();
    expect(records.length).toBeGreaterThan(0);
    records.forEach((r: any) => expect(r.project_id).toBe(pid));
  });

  it('filters by startDate and endDate', async () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const res = await GET(
      makeRequest({
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
        limit: '100',
      })
    );
    const records = await res.json();
    expect(records.length).toBeGreaterThan(0);
  });

  it('defaults to 1000 limit when none specified', async () => {
    const res = await GET(makeRequest());
    const records = await res.json();
    expect(records.length).toBeLessThanOrEqual(1000);
  });
});

describe('POST /api/usage', () => {
  it('creates a new usage record', async () => {
    const projects = getAllProjects();
    const res = await POST(
      makeRequest({}, {
        method: 'POST',
        body: {
          projectId: projects[0].id,
          provider: 'openai',
          model: 'gpt-4o-mini',
          inputTokens: 500,
          outputTokens: 200,
          cost: 0.002,
        },
      })
    );
    expect(res.status).toBe(201);
    const record = await res.json();
    expect(record).toHaveProperty('id');
    expect(record.provider).toBe('openai');
    expect(record.model).toBe('gpt-4o-mini');
    expect(record.inputTokens).toBe(500);
  });

  it('accepts optional timestamp', async () => {
    const projects = getAllProjects();
    const ts = '2025-01-15T10:00:00.000Z';
    const res = await POST(
      makeRequest({}, {
        method: 'POST',
        body: {
          projectId: projects[0].id,
          provider: 'anthropic',
          model: 'claude-3-haiku',
          inputTokens: 300,
          outputTokens: 100,
          cost: 0.001,
          timestamp: ts,
        },
      })
    );
    expect(res.status).toBe(201);
    const record = await res.json();
    expect(record.timestamp).toBe(ts);
  });
});
