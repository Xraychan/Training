import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-production';

function getCurrentUser(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// GET /api/departments — returns departments with their groups
export async function GET(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const departments = await prisma.department.findMany({
    include: { groups: true },
    orderBy: { name: 'asc' },
  });

  // Map to match the Department type shape used in the frontend
  const mapped = departments.map(d => ({
    id: d.id,
    name: d.name,
    groups: d.groups.map(g => ({ id: g.id, name: g.name })),
  }));

  return NextResponse.json({ departments: mapped });
}

// POST /api/departments — create department (SUPER_ADMIN / ADMIN only)
export async function POST(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const dept = await prisma.department.create({ data: { name } });
  return NextResponse.json({ department: { ...dept, groups: [] } }, { status: 201 });
}
