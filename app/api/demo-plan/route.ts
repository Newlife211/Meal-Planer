export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (per IP, 3 requests per hour)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQ = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQ) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: 'Вы превысили лимит демо-генераций. Зарегистрируйтесь для неограниченного доступа!' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const goal: string = body?.goal || 'maintain';
    const lang: 'en' | 'ru' = body?.lang === 'en' ? 'en' : 'ru';

    const goalLabels: Record<string, { en: string; ru: string }> = {
      lose: { en: 'weight loss', ru: 'снижение веса' },
      gain: { en: 'muscle gain', ru: 'набор массы' },
      maintain: { en: 'maintain weight', ru: 'поддержание веса' },
    };
    const goalLabel = goalLabels[goal]?.[lang] || goalLabels.maintain[lang];

    const prompt =
      lang === 'ru'
        ? `Ты профессиональный нутрициолог. Создай пример плана питания на 1 день для цели: ${goalLabel}.
Ответь строго в JSON формате (без markdown, без обёртки в код-блоки):
{
  "dayLabel": "Понедельник",
  "totalKcal": 1800,
  "meals": [
    { "type": "Завтрак", "name": "...", "kcal": 450, "description": "краткое описание 1 предложение" },
    { "type": "Обед", "name": "...", "kcal": 550, "description": "..." },
    { "type": "Перекус", "name": "...", "kcal": 200, "description": "..." },
    { "type": "Ужин", "name": "...", "kcal": 500, "description": "..." }
  ],
  "macros": { "protein": "120г", "fat": "60г", "carbs": "180г" },
  "tip": "Короткий полезный совет по питанию (1 предложение)"
}
Ответь только JSON.`
        : `You are a professional nutritionist. Create a sample 1-day meal plan for the goal: ${goalLabel}.
Respond strictly in JSON format (no markdown, no code blocks):
{
  "dayLabel": "Monday",
  "totalKcal": 1800,
  "meals": [
    { "type": "Breakfast", "name": "...", "kcal": 450, "description": "short 1-sentence description" },
    { "type": "Lunch", "name": "...", "kcal": 550, "description": "..." },
    { "type": "Snack", "name": "...", "kcal": 200, "description": "..." },
    { "type": "Dinner", "name": "...", "kcal": 500, "description": "..." }
  ],
  "macros": { "protein": "120g", "fat": "60g", "carbs": "180g" },
  "tip": "Short helpful nutrition tip (1 sentence)"
}
Respond with raw JSON only.`;

    const llmRes = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemini-3.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!llmRes.ok) {
      console.error('Demo plan LLM error:', llmRes.status, await llmRes.text().catch(() => ''));
      return NextResponse.json({ error: 'Ошибка генерации' }, { status: 502 });
    }

    const data = await llmRes.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Пустой ответ от ИИ' }, { status: 502 });
    }

    const plan = JSON.parse(content);
    return NextResponse.json({ plan });
  } catch (err: any) {
    console.error('Demo plan error:', err?.message);
    return NextResponse.json({ error: 'Ошибка генерации плана' }, { status: 500 });
  }
}
