import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request);
    const payload = token ? verifyToken(token) : null;

    if (!payload && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { status, managerId, managerName } = await request.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const submission = await prisma.formSubmission.update({
      where: { id },
      data: {
        status,
        managerId,
        managerName,
      },
    });

    return NextResponse.json(submission);

  } catch (error) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ error: 'Failed to update submission status' }, { status: 500 });
  }
}
