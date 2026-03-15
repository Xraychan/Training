import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // 1. Validate and consume the token from DB
    const resetEntry = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetEntry || resetEntry.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    // 2. Hash the new password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Update the user in the database
    const user = await prisma.user.update({
      where: { email: resetEntry.email },
      data: { passwordHash }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // 4. Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: resetEntry.id }
    });

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
