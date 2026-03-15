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

// GET /api/users - returns all users (SUPER_ADMIN / ADMIN only)
export async function GET(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

// POST /api/users - create user (SUPER_ADMIN / ADMIN only)
export async function POST(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, email, role, departmentId, groupId, passwordHash } = await req.json();

  if (!name || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role,
        departmentId: departmentId || null,
        groupId: groupId || null,
        passwordHash,
      },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// DELETE /api/users - delete user (SUPER_ADMIN / ADMIN only)
export async function DELETE(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'User deleted' });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
