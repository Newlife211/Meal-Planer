// Low-level Telegram Bot API helpers.

const TG_API = 'https://api.telegram.org';

function token(): string {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

export async function tgCall(method: string, payload: Record<string, any>): Promise<any> {
  const t = token();
  if (!t) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return null;
  }
  try {
    const res = await fetch(`${TG_API}/bot${t}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      console.error(`Telegram ${method} error:`, JSON.stringify(data));
    }
    return data;
  } catch (e: any) {
    console.error(`Telegram ${method} exception:`, e?.message);
    return null;
  }
}

export function escapeHtml(s: string): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const MAX_LEN = 3900;

// Splits long text on paragraph/line boundaries to respect Telegram's 4096 limit.
export function chunkText(text: string): string[] {
  if (text.length <= MAX_LEN) return [text];
  const chunks: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + line + '\n').length > MAX_LEN) {
      if (current) chunks.push(current);
      if (line.length > MAX_LEN) {
        // Hard-split an overly long single line.
        for (let i = 0; i < line.length; i += MAX_LEN) {
          chunks.push(line.slice(i, i + MAX_LEN));
        }
        current = '';
      } else {
        current = line + '\n';
      }
    } else {
      current += line + '\n';
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export function inlineKeyboard(rows: InlineButton[][]) {
  return { inline_keyboard: rows };
}

export async function sendMessage(
  chatId: string | number,
  text: string,
  extra?: Record<string, any>
): Promise<any> {
  const parts = chunkText(text);
  let last: any = null;
  for (let i = 0; i < parts.length; i++) {
    // Only attach the keyboard/extra to the final chunk.
    const isLast = i === parts.length - 1;
    last = await tgCall('sendMessage', {
      chat_id: chatId,
      text: parts[i],
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(isLast ? extra || {} : {}),
    });
  }
  return last;
}

export async function sendPhoto(
  chatId: string | number,
  photoUrl: string,
  caption: string,
  extra?: Record<string, any>
): Promise<any> {
  return tgCall('sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption.slice(0, 1024),
    parse_mode: 'HTML',
    ...(extra || {}),
  });
}

// Uploads raw image bytes as a photo via multipart/form-data (used for
// on-the-fly generated dish images that are returned as base64, not URLs).
export async function sendPhotoBytes(
  chatId: string | number,
  bytes: Uint8Array,
  caption: string,
  extra?: Record<string, any>
): Promise<any> {
  const t = token();
  if (!t) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return null;
  }
  try {
    const form = new FormData();
    form.append('chat_id', String(chatId));
    if (caption) form.append('caption', caption.slice(0, 1024));
    form.append('parse_mode', 'HTML');
    if (extra?.reply_markup) form.append('reply_markup', JSON.stringify(extra.reply_markup));
    form.append('photo', new Blob([bytes], { type: 'image/png' }), 'dish.png');
    const res = await fetch(`${TG_API}/bot${t}/sendPhoto`, { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      console.error('Telegram sendPhoto(bytes) error:', JSON.stringify(data));
    }
    return data;
  } catch (e: any) {
    console.error('Telegram sendPhoto(bytes) exception:', e?.message);
    return null;
  }
}

export async function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  extra?: Record<string, any>
): Promise<any> {
  // Editing cannot span multiple messages; truncate defensively.
  const safe = text.length > MAX_LEN ? text.slice(0, MAX_LEN) : text;
  return tgCall('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: safe,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(extra || {}),
  });
}

export async function answerCallbackQuery(id: string, text?: string): Promise<any> {
  return tgCall('answerCallbackQuery', {
    callback_query_id: id,
    ...(text ? { text } : {}),
  });
}

export async function sendChatAction(chatId: string | number, action = 'typing'): Promise<any> {
  return tgCall('sendChatAction', { chat_id: chatId, action });
}
