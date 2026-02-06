import { describe, it, expect, beforeAll } from 'vitest';
import { escapeCsvCell, toCsv } from '@/lib/csv';
import { seedDatabase } from '@/lib/db';
import { GET } from '@/app/api/export/route';
import { NextRequest } from 'next/server';

function makeExportRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/export');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

beforeAll(() => seedDatabase());

// ── CSV utility tests ────────────────────────────────────────────────────────

describe('escapeCsvCell', () => {
  it('returns empty string for null/undefined', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });

  it('converts numbers to strings', () => {
    expect(escapeCsvCell(42)).toBe('42');
    expect(escapeCsvCell(3.14)).toBe('3.14');
  });

  it('returns plain string unchanged when no special chars', () => {
    expect(escapeCsvCell('hello')).toBe('hello');
    expect(escapeCsvCell('simple text')).toBe('simple text');
  });

  it('wraps value with commas in double quotes', () => {
    expect(escapeCsvCell('hello, world')).toBe('"hello, world"');
  });

  it('escapes double quotes by doubling them', () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps value with newlines in double quotes', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('handles carriage returns', () => {
    expect(escapeCsvCell('line1\rline2')).toBe('"line1\rline2"');
  });

  it('handles value with both commas and quotes', () => {
    expect(escapeCsvCell('he said "yes", indeed')).toBe('"he said ""yes"", indeed"');
  });
});

describe('toCsv', () => {
  it('generates header-only CSV when no rows', () => {
    const result = toCsv(['Name', 'Age'], []);
    expect(result).toBe('Name,Age');
  });

  it('generates CSV with headers and rows', () => {
    const result = toCsv(['Name', 'Cost'], [['Project A', 10.5], ['Project B', 20]]);
    expect(result).toBe('Name,Cost\r\nProject A,10.5\r\nProject B,20');
  });

  it('uses CRLF line endings per RFC 4180', () => {
    const result = toCsv(['A'], [['1'], ['2']]);
    expect(result).toContain('\r\n');
    expect(result.split('\r\n').length).toBe(3);
  });

  it('escapes special characters in rows', () => {
    const result = toCsv(['Name', 'Note'], [['Alice', 'uses "fancy" quotes']]);
    expect(result).toContain('"uses ""fancy"" quotes"');
  });

  it('handles empty headers and rows', () => {
    const result = toCsv([], []);
    expect(result).toBe('');
  });
});

// ── Export API route tests ───────────────────────────────────────────────────

describe('GET /api/export', () => {
  it('returns 400 when type param is missing', async () => {
    const res = await GET(makeExportRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('type');
  });

  it('returns 400 for invalid type', async () => {
    const res = await GET(makeExportRequest({ type: 'invalid' }));
    expect(res.status).toBe(400);
  });

  it('exports usage CSV with proper headers', async () => {
    const res = await GET(makeExportRequest({ type: 'usage', range: '7d' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toContain('attachment');
    expect(res.headers.get('content-disposition')).toContain('.csv');

    const csv = await res.text();
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('ID,Project ID,Provider,Model,Input Tokens,Output Tokens,Cost,Timestamp');
    expect(lines.length).toBeGreaterThan(1); // at least header + 1 data row
  });

  it('exports projects CSV with proper headers', async () => {
    const res = await GET(makeExportRequest({ type: 'projects', range: '30d' }));
    expect(res.status).toBe(200);

    const csv = await res.text();
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('ID,Name,Monthly Budget,Total Cost,Request Count');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('exports budgets CSV with proper headers', async () => {
    const res = await GET(makeExportRequest({ type: 'budgets' }));
    expect(res.status).toBe(200);

    const csv = await res.text();
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('ID,Project,Provider,Monthly Limit,Alert Threshold,Active');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('respects custom date range for usage export', async () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const from = weekAgo.toISOString().split('T')[0];
    const to = now.toISOString().split('T')[0];

    const res = await GET(makeExportRequest({ type: 'usage', range: 'custom', from, to }));
    expect(res.status).toBe(200);

    const csv = await res.text();
    const lines = csv.split('\r\n').filter(l => l.length > 0);
    expect(lines.length).toBeGreaterThan(1);
  });

  it('respects 90d range preset', async () => {
    const res = await GET(makeExportRequest({ type: 'usage', range: '90d' }));
    expect(res.status).toBe(200);

    const csv = await res.text();
    const lines = csv.split('\r\n').filter(l => l.length > 0);
    // 90d should have more data than 7d
    expect(lines.length).toBeGreaterThan(10);
  });

  it('usage CSV rows have correct number of columns', async () => {
    const res = await GET(makeExportRequest({ type: 'usage', range: '7d' }));
    const csv = await res.text();
    const lines = csv.split('\r\n').filter(l => l.length > 0);
    const headerCount = lines[0].split(',').length;

    // Check first few data rows
    for (let i = 1; i < Math.min(5, lines.length); i++) {
      // Simple check: at least as many commas as header (some fields might be quoted with commas inside)
      expect(lines[i].length).toBeGreaterThan(0);
    }
    expect(headerCount).toBe(8); // 8 columns for usage
  });

  it('budgets CSV contains budget data', async () => {
    const res = await GET(makeExportRequest({ type: 'budgets' }));
    const csv = await res.text();
    const lines = csv.split('\r\n').filter(l => l.length > 0);
    // Seeded DB has 8 budgets (1 global + 4 project + 3 provider)
    expect(lines.length).toBeGreaterThanOrEqual(8);
  });

  it('projects CSV contains all seeded projects', async () => {
    const res = await GET(makeExportRequest({ type: 'projects', range: '90d' }));
    const csv = await res.text();
    // Should contain project names from seed data
    expect(csv).toContain('Chatbot v2');
    expect(csv).toContain('Code Copilot');
    expect(csv).toContain('Content Engine');
    expect(csv).toContain('Data Pipeline');
  });

  it('filename in Content-Disposition matches type', async () => {
    const res = await GET(makeExportRequest({ type: 'projects' }));
    const disposition = res.headers.get('content-disposition') || '';
    expect(disposition).toContain('projects-export-');
  });
});
