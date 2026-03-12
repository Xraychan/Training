import { NextRequest, NextResponse } from 'next/server';
import { validateResetToken } from '@/lib/store';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token is required.' }, { status: 400 });

  const email = validateResetToken(token);
  if (!email) return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });

  return NextResponse.json({ email });
}
