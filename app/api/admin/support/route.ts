export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: admin lists all support tickets with user info and message threads
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  const openCount = tickets.filter((t: any) => t.status === 'open').length;

  return NextResponse.json({ tickets, openCount });
}
