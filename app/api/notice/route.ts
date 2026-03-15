import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const FALLBACK_NOTICE = {
  id: 'notice-1',
  content: '"The system is currently running with a local fallback notice. Configure a database for persistent shared messages."',
  updatedBy: 'system',
  updatedAt: new Date().toISOString()
};

export async function GET() {
  try {
    const notice = await prisma.notice.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(notice || FALLBACK_NOTICE);
  } catch (error) {
    console.warn('Prisma not available, using fallback notice.');
    return NextResponse.json(FALLBACK_NOTICE);
  }
}

export async function PATCH(request: Request) {
  let content = '';
  let updatedBy = '';

  try {
    const json = await request.json();
    content = json.content;
    updatedBy = json.updatedBy;
    
    const notice = await prisma.notice.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (notice) {
      const updated = await prisma.notice.update({
        where: { id: notice.id },
        data: { content, updatedBy, updatedAt: new Date() }
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.notice.create({
        data: { content, updatedBy }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error('Notice API Update Error:', error);
    // On failure (e.g. no DB), we just return success but it won't persist across sessions
    return NextResponse.json({ 
      id: 'notice-temp', 
      content, 
      updatedBy, 
      updatedAt: new Date().toISOString() 
    });
  }
}
