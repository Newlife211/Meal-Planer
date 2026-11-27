export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUsageView, checkAndConsume } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ingredientName, mealName } = body ?? {};
    const lang: 'en' | 'ru' = body?.lang === 'en' ? 'en' : 'ru';

    // Free-tier gating: limit monthly meal/ingredient replacements.
    const usage = await getUsageView(session.user.id);
    if (!usage.isPremium && usage.replaces.used >= usage.replaces.limit) {
      return NextResponse.json(
        {
          error: 'LIMIT_REACHED',
          code: 'LIMIT_REACHED',
          kind: 'replace',
          limit: usage.replaces.limit,
          resetAt: usage.replaces.resetAt,
        },
        { status: 403 }
      );
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    const allergyMap: Record<string, { en: string; ru: string }> = {
      Nuts: { en: 'nuts', ru: 'орехи' },
      Dairy: { en: 'dairy', ru: 'молочные продукты' },
      Eggs: { en: 'eggs', ru: 'яйца' },
      Seafood: { en: 'seafood', ru: 'морепродукты' },
      Gluten: { en: 'gluten', ru: 'глютен' },
    };
    const allergyList = (Array.isArray(profile?.allergies) ? (profile?.allergies ?? []) : [])
      .map((a: any) => allergyMap[a]?.[lang] ?? a);

    const currency = (profile?.currency as 'USD' | 'GBP' | 'EUR' | 'RUB') ?? 'RUB';
    const regionMeta: Record<string, { en: string; ru: string }> = {
      USD: { en: 'the United States', ru: 'США' },
      GBP: { en: 'the United Kingdom', ru: 'Великобритании' },
      EUR: { en: 'Europe', ru: 'Европы' },
      RUB: { en: 'Russia', ru: 'России' },
    };
    const regionEn = regionMeta[currency]?.en ?? 'Russia';
    const regionRu = regionMeta[currency]?.ru ?? 'России';
    const unitSystem = profile?.unitSystem === 'imperial' ? 'imperial' : 'metric';
    const amountExample = lang === 'en'
      ? (unitSystem === 'imperial' ? '4 oz' : '100g')
      : (unitSystem === 'imperial' ? '4 oz' : '100г');
    const unitsEn = unitSystem === 'imperial' ? 'US imperial units (oz, lb, cups, fl oz)' : 'metric units (g, kg, ml)';
    const unitsRu = unitSystem === 'imperial' ? 'имперских единицах США (oz, lb, чашки, fl oz)' : 'метрических единицах (г, кг, мл)';

    const prompt = lang === 'en'
      ? `Suggest a replacement for the ingredient "${ingredientName ?? ''}" in the dish "${mealName ?? ''}".
Allergies: ${allergyList.join(', ') || 'none'}
Diet: ${profile?.dietaryPreference ?? 'regular'}
Prefer ingredients common in ${regionEn}. Express the amount in ${unitsEn}.

Respond in JSON: {"original": "original", "replacement": "replacement", "amount": "${amountExample}", "reason": "why"}
In English. Only clean JSON.`
      : `Предложи замену ингредиенту "${ingredientName ?? ''}" в блюде "${mealName ?? ''}".
Аллергии: ${allergyList.join(', ') || 'нет'}
Диета: ${profile?.dietaryPreference ?? 'обычное'}
Предпочитай ингредиенты, распространённые в ${regionRu}. Укажи количество в ${unitsRu}.

Ответь JSON: {"original": "исходный", "replacement": "замена", "amount": "${amountExample}", "reason": "почему"}
На русском. Только чистый JSON.`;

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API ключ не настроен' }, { status: 500 });
    }

    const llmRes = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!llmRes.ok) {
      return NextResponse.json({ error: 'Ошибка LLM API' }, { status: 502 });
    }

    const llmData = await llmRes.json();
    const content = llmData?.choices?.[0]?.message?.content ?? '{}';
    const result = JSON.parse(content);

    await checkAndConsume(session.user.id, 'replace');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Replace ingredient error:', error);
    return NextResponse.json({ error: 'Ошибка замены ингредиента' }, { status: 500 });
  }
}
