import { describe, it, expect, beforeAll } from "vitest";
import { seedDatabase } from "@/lib/db";
import { GET } from "@/app/api/dashboard/route";
import { NextRequest } from "next/server";

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/dashboard");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

beforeAll(() => seedDatabase());

describe("Date range filtering via startDate/endDate", () => {
  it("overview: startDate/endDate filters narrow results", async () => {
    const resWide = await GET(makeRequest({ days: "90" }));
    const bodyWide = await resWide.json();

    // Use a narrow custom range (last 3 days)
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
    const resNarrow = await GET(
      makeRequest({ startDate: start, endDate: end, days: "3" })
    );
    const bodyNarrow = await resNarrow.json();

    // 90-day window should have >= daily spend entries than 3-day
    expect(bodyWide.dailySpend.length).toBeGreaterThanOrEqual(
      bodyNarrow.dailySpend.length
    );
  });

  it("projects view: respects date range", async () => {
    const res90 = await GET(makeRequest({ view: "projects", days: "90" }));
    const body90 = await res90.json();

    const res7 = await GET(makeRequest({ view: "projects", days: "7" }));
    const body7 = await res7.json();

    // 90 day total cost should be >= 7 day total cost for each project
    for (const proj90 of body90.projects) {
      const proj7 = body7.projects.find((p: any) => p.id === proj90.id);
      if (proj7) {
        expect(proj90.total_cost).toBeGreaterThanOrEqual(proj7.total_cost);
      }
    }
  });

  it("providers view: respects date range", async () => {
    const res90 = await GET(makeRequest({ view: "providers", days: "90" }));
    const body90 = await res90.json();

    const res7 = await GET(makeRequest({ view: "providers", days: "7" }));
    const body7 = await res7.json();

    // Total cost in 90d should be >= 7d
    const total90 = body90.providerBreakdown.reduce(
      (s: number, p: any) => s + p.total_cost,
      0
    );
    const total7 = body7.providerBreakdown.reduce(
      (s: number, p: any) => s + p.total_cost,
      0
    );
    expect(total90).toBeGreaterThanOrEqual(total7);
  });

  it("budgets view: accepts startDate/endDate without error", async () => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
    const res = await GET(
      makeRequest({ view: "budgets", startDate: start, endDate: end, days: "14" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("budgets");
    expect(body).toHaveProperty("providerBreakdown");
    expect(body).toHaveProperty("projectBreakdown");
  });

  it("custom date range returns consistent data shape", async () => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0];

    const res = await GET(
      makeRequest({ startDate: start, endDate: end, days: "60" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    // Should have same shape as default overview
    expect(body).toHaveProperty("stats");
    expect(body).toHaveProperty("dailySpend");
    expect(body).toHaveProperty("providerBreakdown");
    expect(body).toHaveProperty("projectSummaries");
    expect(body.stats).toHaveProperty("totalRequests");
    expect(typeof body.stats.totalRequests).toBe("number");
  });
});
