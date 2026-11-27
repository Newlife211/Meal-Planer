export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST: the ticket owner adds a follow-up message to their own ticket
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = (await request.json()) ?? {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'MESSAGE_REQUIRED' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket || ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    await prisma.supportMessage.create({
      data: { ticketId: ticket.id, isAdmin: false, body: message.trim().slice(0, 5000) },
    });
    // A new user message reopens the ticket for the support team
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'open' },
    });

    const updated = await prisma.supportTicket.findUnique({
      where: { id: ticket.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error('Add support message error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
