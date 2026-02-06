import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject, getProjectBreakdown } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get('stats') === 'true';

    if (withStats) {
      const breakdown = getProjectBreakdown(30);
      return NextResponse.json(breakdown);
    }

    const projects = getAllProjects();
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const project = createProject(body.name, body.description || '', body.monthlyBudget || null);
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
