import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.passwordHash !== passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        departmentId: user.departmentId,
        groupId: user.groupId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        groupId: user.groupId
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
