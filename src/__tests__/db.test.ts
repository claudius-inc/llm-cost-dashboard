import { describe, it, expect, beforeAll } from 'vitest';
import {
  getDb,
  seedDatabase,
  genId,
  getAllProjects,
  getProject,
  createProject,
  getUsageRecords,
  createUsageRecord,
  getAllBudgets,
  createBudget,
  getBudgetAlerts,
  getDailySpend,
  getProviderBreakdown,
  getProjectBreakdown,
  getMonthlySpend,
  getTotalRequests,
  getModelBreakdown,
} from '@/lib/db';

// ── Schema & Connection ──────────────────────────────────────────────────────

describe('Database connection', () => {
  it('returns a Database instance', () => {
    const db = getDb();
    expect(db).toBeDefined();
    // WAL pragma should have been set
    const mode = db.pragma('journal_mode', { simple: true });
    expect(mode).toBe('wal');
  });

  it('creates all expected tables', () => {
    const db = getDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r: any) => r.name);
    expect(tables).toContain('projects');
    expect(tables).toContain('usage_records');
    expect(tables).toContain('budgets');
    expect(tables).toContain('budget_alerts');
  });
});

// ── genId ────────────────────────────────────────────────────────────────────

describe('genId', () => {
  it('returns a valid UUID', () => {
    const id = genId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 50 }, () => genId()));
    expect(ids.size).toBe(50);
  });
});

// ── Seed ─────────────────────────────────────────────────────────────────────

describe('seedDatabase', () => {
  let result: { projects: number; records: number; budgets: number };

  beforeAll(() => {
    result = seedDatabase();
  });

  it('creates 4 projects', () => {
    expect(result.projects).toBe(4);
    expect(getAllProjects()).toHaveLength(4);
  });

  it('generates a large number of usage records', () => {
    expect(result.records).toBeGreaterThan(500);
  });

  it('creates budgets (project + provider + global)', () => {
    expect(result.budgets).toBeGreaterThanOrEqual(7); // 1 global + 4 project + 3 provider
  });

  it('is idempotent (re-seed clears old data)', () => {
    const second = seedDatabase();
    expect(second.projects).toBe(4);
    expect(getAllProjects()).toHaveLength(4);
  });
});

// ── Projects CRUD ────────────────────────────────────────────────────────────

describe('Projects', () => {
  beforeAll(() => seedDatabase());

  it('getAllProjects returns seeded projects', () => {
    const projects = getAllProjects();
    expect(projects.length).toBe(4);
    const names = projects.map((p: any) => p.name);
    expect(names).toContain('Chatbot v2');
    expect(names).toContain('Code Copilot');
  });

  it('getProject returns a single project by id', () => {
    const all = getAllProjects();
    const project = getProject(all[0].id);
    expect(project).toBeDefined();
    expect(project.name).toBe(all[0].name);
  });

  it('getProject returns undefined for non-existent id', () => {
    expect(getProject('non-existent-id')).toBeUndefined();
  });

  it('createProject inserts and returns project', () => {
    const p = createProject('Test Project', 'A test', 100);
    expect(p.id).toBeDefined();
    expect(p.name).toBe('Test Project');
    const fetched = getProject(p.id);
    expect(fetched).toBeDefined();
    expect(fetched.name).toBe('Test Project');
  });
});

// ── Usage Records ────────────────────────────────────────────────────────────

describe('Usage Records', () => {
  beforeAll(() => seedDatabase());

  it('getUsageRecords returns records', () => {
    const records = getUsageRecords({ limit: 10 });
    expect(records.length).toBe(10);
    expect(records[0]).toHaveProperty('project_id');
    expect(records[0]).toHaveProperty('provider');
    expect(records[0]).toHaveProperty('cost');
  });

  it('filters by provider', () => {
    const records = getUsageRecords({ provider: 'openai', limit: 50 });
    expect(records.length).toBeGreaterThan(0);
    records.forEach((r: any) => expect(r.provider).toBe('openai'));
  });

  it('filters by projectId', () => {
    const project = getAllProjects()[0];
    const records = getUsageRecords({ projectId: project.id, limit: 50 });
    expect(records.length).toBeGreaterThan(0);
    records.forEach((r: any) => expect(r.project_id).toBe(project.id));
  });

  it('filters by date range', () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const records = getUsageRecords({
      startDate: weekAgo.toISOString(),
      endDate: now.toISOString(),
      limit: 500,
    });
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      const ts = new Date(r.timestamp);
      expect(ts.getTime()).toBeGreaterThanOrEqual(weekAgo.getTime() - 1000);
      expect(ts.getTime()).toBeLessThanOrEqual(now.getTime() + 1000);
    }
  });

  it('createUsageRecord inserts record', () => {
    const project = getAllProjects()[0];
    const rec = createUsageRecord({
      projectId: project.id,
      provider: 'openai',
      model: 'gpt-4o',
      inputTokens: 1000,
      outputTokens: 500,
      cost: 0.0075,
    });
    expect(rec.id).toBeDefined();
    expect(rec.provider).toBe('openai');
  });
});

// ── Budgets ──────────────────────────────────────────────────────────────────

describe('Budgets', () => {
  beforeAll(() => seedDatabase());

  it('getAllBudgets returns seeded budgets', () => {
    const budgets = getAllBudgets();
    expect(budgets.length).toBeGreaterThanOrEqual(7);
  });

  it('createBudget inserts a new budget', () => {
    const project = getAllProjects()[0];
    const b = createBudget({
      projectId: project.id,
      provider: null,
      monthlyLimit: 999,
      alertThreshold: 0.75,
    });
    expect(b.id).toBeDefined();
    expect(b.monthlyLimit).toBe(999);
  });

  it('getBudgetAlerts returns array', () => {
    const alerts = getBudgetAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    // Alerts might exist depending on spend vs threshold
    if (alerts.length > 0) {
      expect(alerts[0]).toHaveProperty('budget_id');
      expect(alerts[0]).toHaveProperty('percentage');
    }
  });
});

// ── Aggregation Queries ──────────────────────────────────────────────────────

describe('Aggregations', () => {
  beforeAll(() => seedDatabase());

  it('getDailySpend returns date/cost/provider rows', () => {
    const daily = getDailySpend(30);
    expect(daily.length).toBeGreaterThan(0);
    expect(daily[0]).toHaveProperty('date');
    expect(daily[0]).toHaveProperty('cost');
    expect(daily[0]).toHaveProperty('provider');
    // Costs should be positive
    daily.forEach((row: any) => expect(row.cost).toBeGreaterThan(0));
  });

  it('getDailySpend filters by projectId', () => {
    const project = getAllProjects()[0];
    const daily = getDailySpend(30, project.id);
    expect(daily.length).toBeGreaterThan(0);
  });

  it('getProviderBreakdown returns provider summaries', () => {
    const breakdown = getProviderBreakdown(30);
    expect(breakdown.length).toBeGreaterThan(0);
    const providers = breakdown.map((b: any) => b.provider);
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers).toContain('google');
    breakdown.forEach((b: any) => {
      expect(b.total_cost).toBeGreaterThan(0);
      expect(b.request_count).toBeGreaterThan(0);
    });
  });

  it('getProjectBreakdown returns project cost summaries', () => {
    const breakdown = getProjectBreakdown(30);
    expect(breakdown.length).toBe(4);
    breakdown.forEach((p: any) => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('total_cost');
      expect(p).toHaveProperty('request_count');
    });
  });

  it('getMonthlySpend returns a number >= 0', () => {
    const spend = getMonthlySpend(0);
    expect(typeof spend).toBe('number');
    expect(spend).toBeGreaterThanOrEqual(0);
  });

  it('getTotalRequests returns positive count', () => {
    const count = getTotalRequests(30);
    expect(count).toBeGreaterThan(0);
  });

  it('getModelBreakdown returns model-level summaries', () => {
    const models = getModelBreakdown(30);
    expect(models.length).toBeGreaterThan(0);
    models.forEach((m: any) => {
      expect(m).toHaveProperty('model');
      expect(m).toHaveProperty('provider');
      expect(m).toHaveProperty('total_cost');
      expect(m).toHaveProperty('avg_cost_per_request');
    });
  });
});
