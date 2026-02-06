// ── Core Data Model ──────────────────────────────────────────────────────────

export type Provider = "openai" | "anthropic" | "google" | "cohere" | "mistral" | "other";

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  monthlyBudget: number | null; // in USD
  isActive: boolean;
}

export interface UsageRecord {
  id: string;
  projectId: string;
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number; // USD
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface Budget {
  id: string;
  projectId: string | null; // null = global budget
  provider: Provider | null; // null = all providers
  monthlyLimit: number; // USD
  alertThreshold: number; // 0-1 (e.g. 0.8 = alert at 80%)
  isActive: boolean;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  currentSpend: number;
  limit: number;
  percentage: number;
  triggeredAt: string;
  acknowledged: boolean;
}

// ── API Types ────────────────────────────────────────────────────────────────

export interface UsageIngestPayload {
  projectId: string;
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp?: string;
  metadata?: Record<string, string>;
}

export interface DailySpend {
  date: string;
  cost: number;
  provider?: Provider;
}

export interface ProviderBreakdown {
  provider: Provider;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
}

export interface ProjectSummary {
  project: Project;
  totalCost: number;
  costThisMonth: number;
  budgetUsage: number | null; // percentage
  topProvider: Provider | null;
  trend: number; // % change from last month
}

export interface CostOptimization {
  id: string;
  type: "model-downgrade" | "caching" | "prompt-optimization" | "batch-requests" | "provider-switch";
  title: string;
  description: string;
  estimatedSavings: number; // monthly USD
  impact: "low" | "medium" | "high";
  projectId?: string;
  provider?: Provider;
}

export interface DashboardStats {
  totalSpendThisMonth: number;
  totalSpendLastMonth: number;
  monthOverMonthChange: number;
  activeProjects: number;
  totalRequests: number;
  averageCostPerRequest: number;
  topProvider: ProviderBreakdown | null;
  activeBudgetAlerts: number;
}
