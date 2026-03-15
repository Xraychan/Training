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

// GET /api/submissions - list submissions (MANAGER sees their dept/group, ADMIN sees all)
export async function GET(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const where: any = {};
  if (currentUser.role === 'MANAGER') {
    // Managers only see submissions for their department/group
    const user = await prisma.user.findUnique({ where: { id: currentUser.userId } });
    if (!user?.departmentId) {
      return NextResponse.json({ submissions: [] });
    }
    where.departmentId = user.departmentId;
    if (user.groupId) where.groupId = user.groupId;
  } else if (currentUser.role === 'TRAINER') {
    // Trainers only see their own submissions
    where.trainerId = currentUser.userId;
  }

  const submissions = await prisma.formSubmission.findMany({
    where,
    include: { template: { select: { title: true } } },
    orderBy: { submittedAt: 'desc' },
  });

  return NextResponse.json({ submissions });
}

// POST /api/submissions - create a submission
export async function POST(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { 
    templateId, 
    answers, 
    departmentId, 
    groupId, 
    traineeName = '', 
    traineeGroup = '' 
  } = body;

  if (!templateId || !answers) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: currentUser.userId } });
    
    const submission = await prisma.formSubmission.create({
      data: {
        templateId,
        trainerId: currentUser.userId,
        trainerName: user?.name || 'Unknown Trainer',
        departmentId: departmentId || null,
        groupId: groupId || null,
        status: 'PENDING',
        traineeName,
        traineeGroup,
        answers: JSON.stringify(answers),
      },
    });

    // Create notification for MANAGERS in the matching Department AND Group
    await prisma.appNotification.create({
      data: {
        type: 'PENDING_APPROVAL',
        submissionId: submission.id,
        targetDepartmentId: departmentId,
        targetGroupId: groupId, // Simplified: using the submission's group
        message: `New assessment submitted by ${user?.name || 'Trainer'}`,
      }
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (e) {
    console.error('Submission error:', e);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}

// PATCH /api/submissions - update submission (e.g., approval/rejection)
export async function PATCH(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, summary } = await req.json();

  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { id: currentUser.userId } });
    const submission = await prisma.formSubmission.update({
      where: { id },
      data: {
        status,
        summary,
        managerId: currentUser.userId,
        managerName: user?.name,
      },
    });

    // If approved/rejected, we might want to notify the trainer, but skipping for now or clearing notifications
    if (status !== 'PENDING') {
      await prisma.appNotification.deleteMany({ where: { submissionId: id } });
    }

    return NextResponse.json({ submission });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
