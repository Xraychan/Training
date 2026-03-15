import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-production';

function getCurrentUser(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// GET /api/templates - list all templates
export async function GET(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const templates = await prisma.formTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ templates });
}

// POST /api/templates - create or update a template (SUPER_ADMIN / ADMIN only)
export async function POST(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, title, description, structure, theme } = await req.json();

  if (!title || !structure) {
    return NextResponse.json({ error: 'Title and structure are required' }, { status: 400 });
  }

  try {
    if (id) {
      // Update
      const template = await prisma.formTemplate.update({
        where: { id },
        data: {
          title,
          description,
          structure,
          theme,
        },
      });
      return NextResponse.json({ template });
    } else {
      // Create
      const template = await prisma.formTemplate.create({
        data: {
          title,
          description,
          structure,
          theme,
          createdBy: currentUser.userId,
        },
      });
      return NextResponse.json({ template }, { status: 201 });
    }
  } catch (e) {
    console.error('Template save error:', e);
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}

// DELETE /api/templates - delete a template (SUPER_ADMIN / ADMIN only)
export async function DELETE(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    await prisma.formTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
