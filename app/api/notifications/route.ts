import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-production';

function getCurrentUser(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; };
  } catch {
    return null;
  }
}

// GET /api/notifications
export async function GET(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let notifications;

  if (['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    notifications = await prisma.appNotification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } else {
    const user = await prisma.user.findUnique({ where: { id: currentUser.userId } });
    const where: any = {
      targetDepartmentId: user?.departmentId || null,
    };
    if (user?.groupId) {
      where.targetGroupId = user.groupId;
    }
    
    notifications = await prisma.appNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  const mapped = notifications.map(n => ({
    id: n.id,
    type: n.type,
    submissionId: n.submissionId,
    targetDepartmentId: n.targetDepartmentId,
    targetGroupId: n.targetGroupId,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json({ notifications: mapped });
}

// PATCH /api/notifications — mark one as read
export async function PATCH(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.appNotification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/notifications — clear all notifications for current user's scope
export async function DELETE(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    await prisma.appNotification.deleteMany({});
  } else {
    const user = await prisma.user.findUnique({ where: { id: currentUser.userId } });
    const where: any = {
      targetDepartmentId: user?.departmentId || null,
    };
    if (user?.groupId) {
      where.targetGroupId = user.groupId;
    }
    await prisma.appNotification.deleteMany({ where });
  }

  return NextResponse.json({ success: true });
}
