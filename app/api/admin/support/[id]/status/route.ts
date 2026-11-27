export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ALLOWED = ['open', 'answered', 'closed'];

// POST: admin changes a ticket's status (e.g. close or reopen)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { status } = (await request.json()) ?? {};
    if (!status || !ALLOWED.includes(status)) {
      return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin support status error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
