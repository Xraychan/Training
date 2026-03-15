import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  departmentId?: string;
  groupId?: string;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
