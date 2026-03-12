import { NextRequest, NextResponse } from 'next/server';
import { consumeResetToken } from '@/lib/store';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    // Validate and consume the token
    const email = consumeResetToken(token);
    if (!email) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    // Hash the new password server-side
    const passwordHash = createHash('sha256').update(password).digest('hex');

    // Update the user in the store
    // Note: store is a module-level singleton — on the server this is the same Node.js process
    const { store } = await import('@/lib/store');
    const updated = store.updateUserPasswordByEmail(email, passwordHash);

    if (!updated) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
