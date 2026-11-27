export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST: admin replies to a ticket, marks it answered, and notifies the user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { message } = (await request.json()) ?? {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'MESSAGE_REQUIRED' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!ticket) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    await prisma.supportMessage.create({
      data: { ticketId: ticket.id, isAdmin: true, body: message.trim().slice(0, 5000) },
    });
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'answered' },
    });

    // Notify the user that support replied (best-effort)
    try {
      const appUrl = process.env.NEXTAUTH_URL || '';
      const hostname = appUrl ? new URL(appUrl).hostname : 'mail.abacusai.app';
      const supportUrl = `${appUrl}/support`;
      if (ticket.user?.email) {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2b2b2b;">
            <div style="text-align:center; padding: 8px 0 16px;">
              <h2 style="color:#C1440E; margin:0;">Eatwise</h2>
            </div>
            <div style="background:#FAF7F2; border-radius:12px; padding:28px;">
              <h3 style="margin-top:0;">Support replied to your request</h3>
              <p style="margin:0 0 6px;"><strong>Subject:</strong> ${ticket.subject.replace(/</g, '&lt;')}</p>
              <div style="background:#fff; border-radius:8px; padding:14px; margin-top:12px; white-space:pre-wrap;">${message.trim().slice(0, 5000).replace(/</g, '&lt;')}</div>
              <div style="text-align:center; margin: 24px 0 4px;">
                <a href="${supportUrl}" style="background:#C1440E; color:#ffffff; text-decoration:none; padding: 12px 28px; border-radius:10px; font-weight:bold; display:inline-block;">Open in Eatwise</a>
              </div>
            </div>
          </div>`;
        await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deployment_token: process.env.ABACUSAI_API_KEY,
            app_id: process.env.WEB_APP_ID,
            notification_id: process.env.NOTIF_ID_SUPPORT_REPLY,
            subject: `Re: ${ticket.subject.slice(0, 120)}`,
            body: htmlBody,
            is_html: true,
            recipient_email: ticket.user.email,
            sender_email: `noreply@${hostname}`,
            sender_alias: 'Eatwise Support',
          }),
        }).catch(() => {});
      }
    } catch (mailErr) {
      console.error('Support reply notification error:', mailErr);
    }

    // Notify the user in Telegram if their account is linked to a chat (best-effort)
    try {
      const { notifyTelegramSupportReply } = await import('@/lib/telegram/notify');
      await notifyTelegramSupportReply(ticket.userId, ticket.subject, message.trim().slice(0, 5000));
    } catch (tgErr) {
      console.error('Support reply Telegram notification error:', tgErr);
    }

    const updated = await prisma.supportTicket.findUnique({
      where: { id: ticket.id },
      include: {
        user: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error('Admin support reply error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
