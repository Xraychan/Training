import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const templates = await prisma.formTemplate.findMany();
    // Parse the JSON strings back to objects for the API response
    const formatted = templates.map((t: any) => ({
      ...t,
      structure: JSON.parse(t.structure),
      theme: t.theme ? JSON.parse(t.theme) : null
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('API Error /api/templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
