import { NextRequest, NextResponse } from "next/server";
import { getUsageRecords, createUsageRecord, seedDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const records = getUsageRecords({
      projectId: searchParams.get('projectId') || undefined,
      provider: searchParams.get('provider') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    });
    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = createUsageRecord({
      projectId: body.projectId,
      provider: body.provider,
      model: body.model,
      inputTokens: body.inputTokens,
      outputTokens: body.outputTokens,
      cost: body.cost,
      timestamp: body.timestamp,
      metadata: body.metadata,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
