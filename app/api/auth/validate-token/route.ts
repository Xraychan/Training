import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token is required.' }, { status: 400 });

  const record = await prisma.passwordResetToken.findFirst({
    where: { 
      token,
      expiresAt: { gt: new Date() }
    }
  });

  if (!record) return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });

  return NextResponse.json({ email: record.email });
}
