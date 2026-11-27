export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

function resolveOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return process.env.NEXTAUTH_URL || '';
}

export async function POST(request: NextRequest) {
  try {
    const { email, lang } = (await request.json()) ?? {};
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always respond success to avoid leaking which emails are registered.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: tokenHash, resetTokenExpiry: expiry },
    });

    const origin = resolveOrigin(request);
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;
    const isRu = lang === 'ru';

    const subject = isRu
      ? 'Восстановление пароля — Eatwise'
      : 'Reset your password — Eatwise';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2b2b2b;">
        <div style="text-align:center; padding: 8px 0 16px;">
          <h2 style="color:#C1440E; margin:0;">Eatwise</h2>
        </div>
        <div style="background:#FAF7F2; border-radius:12px; padding:28px;">
          <h3 style="margin-top:0;">${isRu ? 'Сброс пароля' : 'Password reset'}</h3>
          <p>${isRu
            ? 'Мы получили запрос на сброс пароля для вашей учётной записи. Нажмите кнопку ниже, чтобы задать новый пароль. Ссылка действительна 1 час.'
            : 'We received a request to reset the password for your account. Click the button below to set a new password. This link is valid for 1 hour.'}</p>
          <div style="text-align:center; margin: 28px 0;">
            <a href="${resetUrl}" style="background:#C1440E; color:#ffffff; text-decoration:none; padding: 12px 28px; border-radius:10px; font-weight:bold; display:inline-block;">
              ${isRu ? 'Сбросить пароль' : 'Reset password'}
            </a>
          </div>
          <p style="font-size:13px; color:#666;">${isRu
            ? 'Если кнопка не работает, скопируйте эту ссылку в браузер:'
            : 'If the button does not work, copy this link into your browser:'}</p>
          <p style="font-size:13px; word-break:break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
          <p style="font-size:13px; color:#666;">${isRu
            ? 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.'
            : 'If you did not request a password reset, you can safely ignore this email.'}</p>
        </div>
      </div>
    `;

    try {
      const appUrl = process.env.NEXTAUTH_URL || origin;
      const hostname = appUrl ? new URL(appUrl).hostname : 'mail.abacusai.app';
      const resp = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_PASSWORD_RESET,
          subject,
          body: htmlBody,
          is_html: true,
          recipient_email: user.email,
          sender_email: `noreply@${hostname}`,
          sender_alias: 'Eatwise',
        }),
      });
      const result = await resp.json().catch(() => ({}));
      if (!result?.success && !result?.notification_disabled) {
        console.error('Password reset email failed:', result?.message);
      }
    } catch (mailErr) {
      console.error('Password reset email error:', mailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
