import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export interface AuthUser {
  userId: string;
  role: string;
}

/**
 * Extracts and verifies the JWT from either:
 * 1. The auth_token HTTP-only cookie (set by login API)
 * 2. The Authorization: Bearer <token> header (fallback)
 */
export function getCurrentUser(req: NextRequest): AuthUser | null {
  try {
    let token = req.cookies.get('auth_token')?.value;

    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function isAdmin(user: AuthUser) {
  return ['SUPER_ADMIN', 'ADMIN'].includes(user.role);
}

export function isSuperAdmin(user: AuthUser) {
  return user.role === 'SUPER_ADMIN';
}
