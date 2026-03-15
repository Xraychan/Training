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

  const upperName = name.trim().toUpperCase();
  const dept = await prisma.department.create({ data: { name: upperName } });
  return NextResponse.json({ department: { ...dept, groups: [] } }, { status: 201 });
}

// PUT /api/departments — update department (SUPER_ADMIN / ADMIN only)
export async function PUT(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, name } = await req.json();
  if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 });

  const upperName = name.trim().toUpperCase();
  const dept = await prisma.department.update({
    where: { id },
    data: { name: upperName },
    include: { groups: true }
  });
  return NextResponse.json({ department: dept });
}

// DELETE /api/departments — delete department (SUPER_ADMIN / ADMIN only)
export async function DELETE(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    // Delete associated groups first if needed, though Prisma might handle it if cascading is set
    // In our schema, Group has fields departmentId. We should delete groups first.
    await prisma.group.deleteMany({ where: { departmentId: id } });
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
