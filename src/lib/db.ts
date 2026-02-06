import Database from 'better-sqlite3';

let _db: Database.Database | null = null;

function getDbPath(): string {
  const path = require('path');
  return path.join(process.cwd(), 'data', 'llm-costs.db');
}

function ensureDataDir(): void {
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.dirname(getDbPath());
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function getDb(): Database.Database {
  if (!_db) {
    ensureDataDir();
    _db = new Database(getDbPath());
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      monthly_budget REAL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost REAL NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      metadata TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      provider TEXT,
      monthly_limit REAL NOT NULL,
      alert_threshold REAL NOT NULL DEFAULT 0.8,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS budget_alerts (
      id TEXT PRIMARY KEY,
      budget_id TEXT NOT NULL,
      current_spend REAL NOT NULL,
      budget_limit REAL NOT NULL,
      percentage REAL NOT NULL,
      triggered_at TEXT NOT NULL DEFAULT (datetime('now')),
      acknowledged INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (budget_id) REFERENCES budgets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_project ON usage_records(project_id);
    CREATE INDEX IF NOT EXISTS idx_usage_provider ON usage_records(provider);
    CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_records(timestamp);
    CREATE INDEX IF NOT EXISTS idx_usage_project_provider ON usage_records(project_id, provider);
  `);
}

// ── Helper: generate UUID ────────────────────────────────────────────────────
export function genId(): string {
  return crypto.randomUUID();
}

// ── Projects ─────────────────────────────────────────────────────────────────

export function getAllProjects() {
  const db = getDb();
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as any[];
}

export function getProject(id: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any | undefined;
}

export function createProject(name: string, description: string, monthlyBudget: number | null) {
  const db = getDb();
  const id = genId();
  db.prepare(
    'INSERT INTO projects (id, name, description, monthly_budget) VALUES (?, ?, ?, ?)'
  ).run(id, name, description, monthlyBudget);
  return { id, name, description, monthlyBudget };
}

// ── Usage Records ────────────────────────────────────────────────────────────

export function getUsageRecords(filters?: {
  projectId?: string;
  provider?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.projectId) {
    conditions.push('project_id = ?');
    params.push(filters.projectId);
  }
  if (filters?.provider) {
    conditions.push('provider = ?');
    params.push(filters.provider);
  }
  if (filters?.startDate) {
    conditions.push('timestamp >= ?');
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    conditions.push('timestamp <= ?');
    params.push(filters.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ? `LIMIT ${filters.limit}` : 'LIMIT 1000';

  return db.prepare(`SELECT * FROM usage_records ${where} ORDER BY timestamp DESC ${limit}`).all(...params) as any[];
}

export function createUsageRecord(record: {
  projectId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp?: string;
  metadata?: Record<string, string>;
}) {
  const db = getDb();
  const id = genId();
  const ts = record.timestamp || new Date().toISOString();
  const meta = record.metadata ? JSON.stringify(record.metadata) : null;

  db.prepare(
    `INSERT INTO usage_records (id, project_id, provider, model, input_tokens, output_tokens, cost, timestamp, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, record.projectId, record.provider, record.model, record.inputTokens, record.outputTokens, record.cost, ts, meta);

  return { id, ...record, timestamp: ts };
}

// ── Budgets ──────────────────────────────────────────────────────────────────

export function getAllBudgets() {
  const db = getDb();
  return db.prepare('SELECT * FROM budgets ORDER BY monthly_limit DESC').all() as any[];
}

export function createBudget(budget: {
  projectId: string | null;
  provider: string | null;
  monthlyLimit: number;
  alertThreshold: number;
}) {
  const db = getDb();
  const id = genId();
  db.prepare(
    'INSERT INTO budgets (id, project_id, provider, monthly_limit, alert_threshold) VALUES (?, ?, ?, ?, ?)'
  ).run(id, budget.projectId, budget.provider, budget.monthlyLimit, budget.alertThreshold);
  return { id, ...budget };
}

export function getBudgetAlerts() {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM budget_alerts WHERE acknowledged = 0 ORDER BY triggered_at DESC'
  ).all() as any[];
}

// ── Aggregation Queries ──────────────────────────────────────────────────────

export function getDailySpend(days: number = 30, projectId?: string, provider?: string, startDate?: string, endDate?: string) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (startDate && endDate) {
    conditions.push('timestamp >= ?');
    params.push(startDate);
    conditions.push('timestamp <= ?');
    params.push(endDate + 'T23:59:59');
  } else {
    conditions.push(`timestamp >= date('now', '-${days} days')`);
  }

  if (projectId) {
    conditions.push('project_id = ?');
    params.push(projectId);
  }
  if (provider) {
    conditions.push('provider = ?');
    params.push(provider);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return db.prepare(`
    SELECT date(timestamp) as date, SUM(cost) as cost, provider
    FROM usage_records
    ${where}
    GROUP BY date(timestamp), provider
    ORDER BY date(timestamp) ASC
  `).all(...params) as any[];
}

export function getProviderBreakdown(days: number = 30, projectId?: string, startDate?: string, endDate?: string) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (startDate && endDate) {
    conditions.push('timestamp >= ?');
    params.push(startDate);
    conditions.push('timestamp <= ?');
    params.push(endDate + 'T23:59:59');
  } else {
    conditions.push(`timestamp >= date('now', '-${days} days')`);
  }

  if (projectId) {
    conditions.push('project_id = ?');
    params.push(projectId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return db.prepare(`
    SELECT 
      provider,
      SUM(cost) as total_cost,
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens,
      COUNT(*) as request_count
    FROM usage_records
    ${where}
    GROUP BY provider
    ORDER BY total_cost DESC
  `).all(...params) as any[];
}

export function getProjectBreakdown(days: number = 30, startDate?: string, endDate?: string) {
  const db = getDb();
  const params: any[] = [];
  let dateFilter: string;

  if (startDate && endDate) {
    dateFilter = `AND u.timestamp >= ? AND u.timestamp <= ?`;
    params.push(startDate, endDate + 'T23:59:59');
  } else {
    dateFilter = `AND u.timestamp >= date('now', '-${days} days')`;
  }

  return db.prepare(`
    SELECT 
      p.id,
      p.name,
      p.monthly_budget,
      COALESCE(SUM(u.cost), 0) as total_cost,
      COALESCE(COUNT(u.id), 0) as request_count
    FROM projects p
    LEFT JOIN usage_records u ON p.id = u.project_id 
      ${dateFilter}
    WHERE p.is_active = 1
    GROUP BY p.id
    ORDER BY total_cost DESC
  `).all(...params) as any[];
}

export function getMonthlySpend(monthOffset: number = 0) {
  const db = getDb();
  const result = db.prepare(`
    SELECT COALESCE(SUM(cost), 0) as total
    FROM usage_records
    WHERE timestamp >= date('now', 'start of month', '-${monthOffset} months')
      AND timestamp < date('now', 'start of month', '-${monthOffset - 1} months')
  `).get() as any;
  return result?.total || 0;
}

export function getTotalRequests(days: number = 30, startDate?: string, endDate?: string) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (startDate && endDate) {
    conditions.push('timestamp >= ?');
    params.push(startDate);
    conditions.push('timestamp <= ?');
    params.push(endDate + 'T23:59:59');
  } else {
    conditions.push(`timestamp >= date('now', '-${days} days')`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM usage_records ${where}
  `).get(...params) as any;
  return result?.count || 0;
}

export function getModelBreakdown(days: number = 30, projectId?: string, startDate?: string, endDate?: string) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (startDate && endDate) {
    conditions.push('timestamp >= ?');
    params.push(startDate);
    conditions.push('timestamp <= ?');
    params.push(endDate + 'T23:59:59');
  } else {
    conditions.push(`timestamp >= date('now', '-${days} days')`);
  }

  if (projectId) {
    conditions.push('project_id = ?');
    params.push(projectId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return db.prepare(`
    SELECT 
      model,
      provider,
      SUM(cost) as total_cost,
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens,
      COUNT(*) as request_count,
      AVG(cost) as avg_cost_per_request
    FROM usage_records
    ${where}
    GROUP BY model, provider
    ORDER BY total_cost DESC
  `).all(...params) as any[];
}

// ── Seed Data ────────────────────────────────────────────────────────────────

const MODEL_COSTS: Record<string, { input: number; output: number; provider: string }> = {
  'gpt-4o':            { input: 2.50,  output: 10.00, provider: 'openai' },
  'gpt-4o-mini':       { input: 0.15,  output: 0.60,  provider: 'openai' },
  'gpt-3.5-turbo':     { input: 0.50,  output: 1.50,  provider: 'openai' },
  'claude-3.5-sonnet':  { input: 3.00,  output: 15.00, provider: 'anthropic' },
  'claude-3-haiku':     { input: 0.25,  output: 1.25,  provider: 'anthropic' },
  'claude-3-opus':      { input: 15.00, output: 75.00, provider: 'anthropic' },
  'gemini-1.5-pro':     { input: 1.25,  output: 5.00,  provider: 'google' },
  'gemini-1.5-flash':   { input: 0.075, output: 0.30,  provider: 'google' },
};

export function seedDatabase() {
  const db = getDb();

  // Clear existing data
  db.exec('DELETE FROM budget_alerts');
  db.exec('DELETE FROM budgets');
  db.exec('DELETE FROM usage_records');
  db.exec('DELETE FROM projects');

  // Create projects
  const projects = [
    { id: genId(), name: 'Chatbot v2', description: 'Customer-facing AI chatbot', monthlyBudget: 500 },
    { id: genId(), name: 'Code Copilot', description: 'Internal code review assistant', monthlyBudget: 1200 },
    { id: genId(), name: 'Content Engine', description: 'Blog and marketing content generation', monthlyBudget: 300 },
    { id: genId(), name: 'Data Pipeline', description: 'ETL data extraction and summarization', monthlyBudget: 800 },
  ];

  const insertProject = db.prepare(
    'INSERT INTO projects (id, name, description, monthly_budget) VALUES (?, ?, ?, ?)'
  );
  for (const p of projects) {
    insertProject.run(p.id, p.name, p.description, p.monthlyBudget);
  }

  // Project-model affinities (which models each project uses most)
  const projectModels: Record<string, { model: string; weight: number }[]> = {
    'Chatbot v2': [
      { model: 'gpt-4o-mini', weight: 40 },
      { model: 'claude-3-haiku', weight: 30 },
      { model: 'gemini-1.5-flash', weight: 20 },
      { model: 'gpt-4o', weight: 10 },
    ],
    'Code Copilot': [
      { model: 'claude-3.5-sonnet', weight: 45 },
      { model: 'gpt-4o', weight: 30 },
      { model: 'claude-3-opus', weight: 15 },
      { model: 'gemini-1.5-pro', weight: 10 },
    ],
    'Content Engine': [
      { model: 'gpt-4o', weight: 35 },
      { model: 'claude-3.5-sonnet', weight: 35 },
      { model: 'gemini-1.5-pro', weight: 20 },
      { model: 'gpt-3.5-turbo', weight: 10 },
    ],
    'Data Pipeline': [
      { model: 'gpt-4o-mini', weight: 30 },
      { model: 'gemini-1.5-flash', weight: 30 },
      { model: 'claude-3-haiku', weight: 25 },
      { model: 'gpt-3.5-turbo', weight: 15 },
    ],
  };

  // Generate 90 days of usage data
  const insertUsage = db.prepare(
    `INSERT INTO usage_records (id, project_id, provider, model, input_tokens, output_tokens, cost, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction(() => {
    for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Weekend multiplier (less traffic on weekends)
      const weekendMult = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.3 : 1.0;
      // Growth trend (slight increase over time)
      const growthMult = 0.7 + (0.3 * (90 - dayOffset) / 90);

      for (const project of projects) {
        const models = projectModels[project.name];
        // Each project generates 5-25 records per day
        const baseRecords = Math.floor(5 + Math.random() * 20);
        const numRecords = Math.max(1, Math.floor(baseRecords * weekendMult * growthMult));

        for (let r = 0; r < numRecords; r++) {
          // Pick model based on weights
          const totalWeight = models.reduce((s, m) => s + m.weight, 0);
          let rand = Math.random() * totalWeight;
          let chosenModel = models[0].model;
          for (const m of models) {
            rand -= m.weight;
            if (rand <= 0) {
              chosenModel = m.model;
              break;
            }
          }

          const modelInfo = MODEL_COSTS[chosenModel];
          const inputTokens = Math.floor(200 + Math.random() * 3000);
          const outputTokens = Math.floor(50 + Math.random() * 2000);
          const cost = (inputTokens / 1_000_000) * modelInfo.input + (outputTokens / 1_000_000) * modelInfo.output;

          // Random time during the day
          const hour = Math.floor(8 + Math.random() * 14); // 8am-10pm
          const minute = Math.floor(Math.random() * 60);
          const timestamp = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;

          insertUsage.run(
            genId(),
            project.id,
            modelInfo.provider,
            chosenModel,
            inputTokens,
            outputTokens,
            Math.round(cost * 1_000_000) / 1_000_000, // round to 6 decimals
            timestamp
          );
        }
      }
    }
  });

  insertMany();

  // Create budgets
  const insertBudget = db.prepare(
    'INSERT INTO budgets (id, project_id, provider, monthly_limit, alert_threshold) VALUES (?, ?, ?, ?, ?)'
  );

  // Global budget
  insertBudget.run(genId(), null, null, 3000, 0.8);
  // Per-project budgets
  for (const p of projects) {
    insertBudget.run(genId(), p.id, null, p.monthlyBudget, 0.8);
  }
  // Per-provider budgets
  insertBudget.run(genId(), null, 'openai', 1500, 0.85);
  insertBudget.run(genId(), null, 'anthropic', 1500, 0.85);
  insertBudget.run(genId(), null, 'google', 500, 0.9);

  // Check budgets and create alerts
  const budgets = getAllBudgets();
  const insertAlert = db.prepare(
    'INSERT INTO budget_alerts (id, budget_id, current_spend, budget_limit, percentage, triggered_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  for (const budget of budgets) {
    const conditions: string[] = [`timestamp >= date('now', 'start of month')`];
    const params: any[] = [];

    if (budget.project_id) {
      conditions.push('project_id = ?');
      params.push(budget.project_id);
    }
    if (budget.provider) {
      conditions.push('provider = ?');
      params.push(budget.provider);
    }

    const result = db.prepare(
      `SELECT COALESCE(SUM(cost), 0) as spend FROM usage_records WHERE ${conditions.join(' AND ')}`
    ).get(...params) as any;

    const spend = result?.spend || 0;
    const pct = spend / budget.monthly_limit;

    if (pct >= budget.alert_threshold) {
      insertAlert.run(genId(), budget.id, spend, budget.monthly_limit, pct, new Date().toISOString());
    }
  }

  const recordCount = (db.prepare('SELECT COUNT(*) as c FROM usage_records').get() as any).c;
  return { projects: projects.length, records: recordCount, budgets: budgets.length };
}
