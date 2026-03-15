import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const token = getAuthToken(request);
    const payload = token ? verifyToken(token) : null;

    if (!payload && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, trainerId, trainerName, departmentId, groupId, answers, summary } = body;

    // 1. Create the submission
    const submission = await prisma.formSubmission.create({
      data: {
        templateId,
        trainerId,
        trainerName,
        departmentId,
        groupId,
        status: 'PENDING',
        answers: JSON.stringify(answers),
        summary: summary || '',
      },
    });

    // 2. Create a notification for managers in the same Dept/Group
    await prisma.appNotification.create({
      data: {
        type: 'PENDING_APPROVAL',
        submissionId: submission.id,
        targetDepartmentId: departmentId,
        targetGroupId: groupId,
        message: `New assessment submission from ${trainerName} pending approval.`,
        read: false,
      },
    });

    return NextResponse.json(submission);

  } catch (error) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deptId = searchParams.get('departmentId');
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status') || 'PENDING';

    if (!deptId || !groupId) {
      return NextResponse.json({ error: 'departmentId and groupId are required' }, { status: 400 });
    }

    const submissions = await prisma.formSubmission.findMany({
      where: {
        departmentId: deptId,
        groupId: groupId,
        status: status,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    const formatted = submissions.map(s => ({
      ...s,
      answers: JSON.parse(s.answers)
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
