import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

function getCurrentUser(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

function parseList(l: any) {
  return {
    id: l.id,
    name: l.name,
    items: JSON.parse(l.items),
    sorting: l.sorting,
    isCaseSensitive: l.isCaseSensitive,
  };
}

// GET /api/global-lists
export async function GET(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lists = await prisma.globalList.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ globalLists: lists.map(parseList) });
}

// POST /api/global-lists — create a new list (SUPER_ADMIN / ADMIN only)
export async function POST(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, items = [], sorting = 'NONE', isCaseSensitive = false } = await req.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const existing = await prisma.globalList.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: 'A list with this name already exists' }, { status: 409 });

  const list = await prisma.globalList.create({
    data: {
      name,
      items: JSON.stringify(items),
      sorting,
      isCaseSensitive,
    },
  });

  return NextResponse.json({ globalList: parseList(list) }, { status: 201 });
}

// PATCH /api/global-lists — update a list
export async function PATCH(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, name, items, sorting, isCaseSensitive } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (items !== undefined) updateData.items = JSON.stringify(items);
  if (sorting !== undefined) updateData.sorting = sorting;
  if (isCaseSensitive !== undefined) updateData.isCaseSensitive = isCaseSensitive;

  const list = await prisma.globalList.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ globalList: parseList(list) });
}

// DELETE /api/global-lists — delete a list
export async function DELETE(req: NextRequest) {
  const currentUser = getCurrentUser(req);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.globalList.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
