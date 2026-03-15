import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Legacy SHA-256 hashing for compatibility during migration
async function hashSHA256(text: string): Promise<string> {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let isPasswordMatch = false;

    // Check if it's a bcrypt hash (starts with $2a$ or similar)
    if (user.passwordHash?.startsWith('$2')) {
      isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      // It's a legacy SHA-256 hash or plain text password check
      const inputSHA256 = await hashSHA256(password);
      
      if (user.passwordHash === inputSHA256) {
        isPasswordMatch = true;
        // UPGRADE to bcrypt on success
        const newBcryptHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newBcryptHash }
        });
      }
    }

    if (!isPasswordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HttpOnly Cookie
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      groupId: user.groupId,
      departmentId: user.departmentId
    };

    const response = NextResponse.json({ success: true, user: responseUser });
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
