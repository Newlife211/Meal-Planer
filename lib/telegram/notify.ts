import { prisma } from '@/lib/db';
import { sendMessage, inlineKeyboard, escapeHtml } from './api';
import { findChatByUserId } from './state';

// Sends a Telegram message to a user when support replies to their ticket.
// Best-effort: never throws.
export async function notifyTelegramSupportReply(
  userId: string,
  subject: string,
  body: string
): Promise<void> {
  try {
    const chatId = await findChatByUserId(userId);
    if (!chatId) return;
    const chat = await prisma.telegramChat.findUnique({ where: { id: chatId } });
    const lang = chat?.lang === 'en' ? 'en' : 'ru';
    const title = lang === 'en' ? '🆕 Support replied to your request' : '🆕 Техподдержка ответила на ваше обращение';
    const subjLabel = lang === 'en' ? 'Subject' : 'Тема';
    const openLabel = lang === 'en' ? '🆕 Open support' : '🆕 Открыть поддержку';
    const text =
      `${title}\n\n<b>${subjLabel}:</b> ${escapeHtml(subject)}\n\n${escapeHtml(body)}`;
    await sendMessage(chatId, text, {
      reply_markup: inlineKeyboard([[{ text: openLabel, callback_data: 'support' }]]),
    });
  } catch (e: any) {
    console.error('notifyTelegramSupportReply error:', e?.message);
  }
}

// Emails the admin about a new support request created from the bot,
// mirroring the web support route.
export async function emailAdminNewTicket(
  subject: string,
  message: string,
  userName: string | null,
  userEmail: string | null
): Promise<void> {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'admin' }, select: { email: true } });
    if (!admin?.email) return;
    const appUrl = process.env.NEXTAUTH_URL || '';
    const hostname = appUrl ? new URL(appUrl).hostname : 'mail.abacusai.app';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2b2b2b;">
        <div style="text-align:center; padding: 8px 0 16px;">
          <h2 style="color:#C1440E; margin:0;">Eatwise</h2>
        </div>
        <div style="background:#FAF7F2; border-radius:12px; padding:28px;">
          <h3 style="margin-top:0;">New support request (via Telegram)</h3>
          <p style="margin:0 0 6px;"><strong>From:</strong> ${(userName || '').replace(/</g, '&lt;')} &lt;${(userEmail || '').replace(/</g, '&lt;')}&gt;</p>
          <p style="margin:0 0 6px;"><strong>Subject:</strong> ${subject.slice(0, 200).replace(/</g, '&lt;')}</p>
          <div style="background:#fff; border-radius:8px; padding:14px; margin-top:12px; white-space:pre-wrap;">${message.slice(0, 5000).replace(/</g, '&lt;')}</div>
        </div>
      </div>`;
    await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_NEW_SUPPORT_REQUEST,
        subject: `New support request: ${subject.slice(0, 120)}`,
        body: htmlBody,
        is_html: true,
        recipient_email: admin.email,
        sender_email: `noreply@${hostname}`,
        sender_alias: 'Eatwise',
      }),
    }).catch(() => {});
  } catch (e: any) {
    console.error('emailAdminNewTicket error:', e?.message);
  }
}

// ------------------------------------------------------------------
// System group notifications (admin monitoring)
// ------------------------------------------------------------------

// Sends a plain message to the system admin Telegram group via a DEDICATED
// system bot (TELEGRAM_SYSTEM_BOT_TOKEN), separate from the user-facing bot.
// Best-effort: never throws. No-op if the token or chat id is not set.
export async function notifySystemGroup(text: string): Promise<void> {
  try {
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const token = process.env.TELEGRAM_SYSTEM_BOT_TOKEN;
    if (!chatId || !token) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 3900),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    }).then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!data?.ok) console.error('notifySystemGroup Telegram error:', JSON.stringify(data));
    });
  } catch (e: any) {
    console.error('notifySystemGroup error:', e?.message);
  }
}

function fmtWhen(): string {
  try {
    return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }) + ' МСК';
  } catch {
    return new Date().toISOString();
  }
}

// New user registration.
export async function notifyAdminNewUser(name: string | null, email: string | null): Promise<void> {
  const text =
    `🆕 <b>Новый пользователь</b>\n\n` +
    `<b>Имя:</b> ${escapeHtml(name || '—')}\n` +
    `<b>Email:</b> ${escapeHtml(email || '—')}\n` +
    `<b>Когда:</b> ${fmtWhen()}`;
  return notifySystemGroup(text);
}

// New paid subscription.
export async function notifyAdminNewSubscription(
  name: string | null,
  email: string | null,
  plan: string | null
): Promise<void> {
  const planLabel =
    plan === 'yearly' ? 'Premium (годовой)' :
    plan === 'monthly' ? 'Premium (месячный)' :
    plan ? `Premium (${plan})` : 'Premium';
  const text =
    `💳 <b>Новая подписка</b>\n\n` +
    `<b>Тариф:</b> ${escapeHtml(planLabel)}\n` +
    `<b>Клиент:</b> ${escapeHtml(name || '—')}\n` +
    `<b>Email:</b> ${escapeHtml(email || '—')}\n` +
    `<b>Когда:</b> ${fmtWhen()}`;
  return notifySystemGroup(text);
}

// New support ticket (from web or Telegram bot).
export async function notifyAdminNewTicket(
  subject: string,
  message: string,
  name: string | null,
  email: string | null,
  via: 'web' | 'telegram'
): Promise<void> {
  const src = via === 'telegram' ? 'Telegram' : 'сайт';
  const text =
    `📩 <b>Новое обращение в поддержку</b> (${src})\n\n` +
    `<b>От:</b> ${escapeHtml(name || '—')} (${escapeHtml(email || '—')})\n` +
    `<b>Тема:</b> ${escapeHtml(subject)}\n\n` +
    `${escapeHtml((message || '').slice(0, 1500))}`;
  return notifySystemGroup(text);
}
