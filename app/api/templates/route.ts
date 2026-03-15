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

  // Map 'structure' to 'pages' for the frontend
  const mappedTemplates = templates.map(t => ({
    ...t,
    pages: t.structure ? JSON.parse(t.structure) : [],
    themeId: t.theme || 'default',
  }));

  return NextResponse.json({ templates: mappedTemplates });
}

// POST /api/templates - create or update a template (SUPER_ADMIN / ADMIN only)
export async function POST(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, title, description, pages, themeId } = body;

  if (!title || !pages) {
    return NextResponse.json({ error: 'Title and pages are required' }, { status: 400 });
  }

  try {
    const data = {
      title,
      description,
      structure: JSON.stringify(pages),
      theme: themeId || 'default',
    };

    if (id) {
      // Check if it exists first
      const existing = await prisma.formTemplate.findUnique({ where: { id } });
      
      if (existing) {
        const template = await prisma.formTemplate.update({
          where: { id },
          data,
        });
        return NextResponse.json({ template });
      } else {
        // Create with the provided ID (e.g. from frontend uuidv4)
        const template = await prisma.formTemplate.create({
          data: {
            ...data,
            id,
            createdBy: currentUser.userId,
          },
        });
        return NextResponse.json({ template }, { status: 201 });
      }
    } else {
      // Create with auto-generated ID
      const template = await prisma.formTemplate.create({
        data: {
          ...data,
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
