export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyAdminNewTicket } from '@/lib/telegram/notify';

// GET: list the current user's support tickets with their message threads
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  return NextResponse.json({ tickets });
}

// POST: create a new support ticket with its first message
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subject, message } = (await request.json()) ?? {};
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'SUBJECT_REQUIRED' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'MESSAGE_REQUIRED' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: subject.trim().slice(0, 200),
        status: 'open',
        messages: {
          create: { isAdmin: false, body: message.trim().slice(0, 5000) },
        },
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    // Notify the admin (best-effort, never blocks the response)
    try {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' }, select: { email: true } });
      const appUrl = process.env.NEXTAUTH_URL || '';
      const hostname = appUrl ? new URL(appUrl).hostname : 'mail.abacusai.app';
      if (admin?.email) {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2b2b2b;">
            <div style="text-align:center; padding: 8px 0 16px;">
              <h2 style="color:#C1440E; margin:0;">Eatwise</h2>
            </div>
            <div style="background:#FAF7F2; border-radius:12px; padding:28px;">
              <h3 style="margin-top:0;">New support request</h3>
              <p style="margin:0 0 6px;"><strong>From:</strong> ${session.user.name || ''} &lt;${session.user.email}&gt;</p>
              <p style="margin:0 0 6px;"><strong>Subject:</strong> ${subject.trim().slice(0, 200)}</p>
              <div style="background:#fff; border-radius:8px; padding:14px; margin-top:12px; white-space:pre-wrap;">${message.trim().slice(0, 5000).replace(/</g, '&lt;')}</div>
            </div>
          </div>`;
        await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deployment_token: process.env.ABACUSAI_API_KEY,
            app_id: process.env.WEB_APP_ID,
            notification_id: process.env.NOTIF_ID_NEW_SUPPORT_REQUEST,
            subject: `New support request: ${subject.trim().slice(0, 120)}`,
            body: htmlBody,
            is_html: true,
            recipient_email: admin.email,
            sender_email: `noreply@${hostname}`,
            sender_alias: 'Eatwise',
          }),
        }).catch(() => {});
      }
    } catch (mailErr) {
      console.error('Support admin notification error:', mailErr);
    }

    // Notify the system Telegram group (best-effort, never throws).
    await notifyAdminNewTicket(
      subject.trim().slice(0, 200),
      message.trim(),
      session.user.name ?? null,
      session.user.email ?? null,
      'web'
    );

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
