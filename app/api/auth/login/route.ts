import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-production';

// Helper: check if a string looks like a SHA-256 hex hash (64 hex chars)
function isSha256Hash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Look up user in Prisma (NOT the mock store)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is inactive. Please contact your administrator.' }, { status: 401 });
    }

    let passwordValid = false;

    if (isSha256Hash(user.passwordHash)) {
      // Legacy SHA-256 hash — check and upgrade to bcrypt
      const sha256Input = createHash('sha256').update(password).digest('hex');
      if (sha256Input === user.passwordHash) {
        passwordValid = true;
        // Upgrade to bcrypt automatically
        const bcryptHash = await bcrypt.hash(password, 12);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: bcryptHash },
        });
      }
    } else {
      // Modern bcrypt hash
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Build safe user object (no passwordHash)
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      groupId: user.groupId,
    };

    // Sign JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const response = NextResponse.json({ user: safeUser }, { status: 200 });

    // Set HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
