export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { handleUpdate } from '@/lib/telegram/bot';

// Telegram sends updates here via webhook. We validate the secret header,
// then process the update asynchronously (fire-and-forget) and return 200
// immediately so Telegram does not retry on slow LLM generation.
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (!secret || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: any;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Do NOT await — respond fast, keep processing in the background.
  handleUpdate(update).catch((err) => {
    console.error('Telegram handleUpdate error:', err);
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'telegram-webhook' });
}
