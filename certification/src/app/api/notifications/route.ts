import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deptId = searchParams.get('departmentId');
    const groupId = searchParams.get('groupId');

    if (!deptId || !groupId) {
      return NextResponse.json({ error: 'departmentId and groupId are required' }, { status: 400 });
    }

    const notifications = await prisma.appNotification.findMany({
      where: {
        targetDepartmentId: deptId,
        targetGroupId: groupId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        submission: {
          select: {
            trainerName: true,
            templateId: true,
          }
        }
      }
    });

    return NextResponse.json(notifications);

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Notification IDs array required' }, { status: 400 });
    }

    await prisma.appNotification.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
