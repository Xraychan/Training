import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

  const { name, email, role, departmentId, groupId, password } = await req.json();

  if (!name || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password || 'Certify123!', salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        role,
        departmentId: departmentId || null,
        groupId: groupId || null,
        passwordHash: hash,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    console.error('User creation error:', e);
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

  // Prevent self-deletion
  if (id === currentUser.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'User deleted' });
  } catch (e: any) {
    console.error('User deletion error:', e);
    
    // Handle foreign key constraint error (P2003)
    if (e.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete user because they have submitted assessments or managed reviews. Consider deactivating them instead (future feature).' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

// PATCH /api/users - toggle isActive (SUPER_ADMIN / ADMIN only)
export async function PATCH(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, isActive } = await req.json();
  if (!id || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'ID and isActive (boolean) are required' }, { status: 400 });
  }

  // Prevent self-deactivation
  if (id === currentUser.userId && isActive === false) {
    return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (e) {
    console.error('User update error:', e);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
