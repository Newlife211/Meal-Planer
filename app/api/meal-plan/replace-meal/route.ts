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
    const { mealType, dayIndex, currentMeal } = body ?? {};
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
    const unitsEn = unitSystem === 'imperial' ? 'US imperial units (oz, lb, cups, fl oz)' : 'metric units (g, kg, ml)';
    const unitsRu = unitSystem === 'imperial' ? 'имперских единицах США (oz, lb, чашки, fl oz)' : 'метрических единицах (г, кг, мл)';

    let prompt: string;
    if (lang === 'en') {
      const mealTypeMap: Record<string, string> = {
        breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snack',
      };
      const dietMap: Record<string, string> = { regular: 'regular', vegetarian: 'vegetarian', vegan: 'vegan', gluten_free: 'gluten-free', keto: 'keto' };
      prompt = `You are a professional nutritionist. Suggest an alternative dish to replace "${currentMeal?.name ?? ''}" for ${mealTypeMap[mealType] ?? 'a meal'}.
Diet: ${dietMap[profile?.dietaryPreference ?? ''] ?? 'regular'}
Allergies: ${allergyList.join(', ') || 'none'}
Cooking time: up to ${profile?.cookingTime ?? '30'} min
Use ingredients and cuisine appropriate for ${regionEn}. Express ingredient amounts in ${unitsEn} (nutrition values stay in grams).

Respond strictly in JSON:
{"name": "Name", "ingredients": [{"name": "item", "amount": "100g"}], "calories": 350, "protein": 20, "fat": 15, "carbs": 30, "cookingTime": 15, "recipe": "Recipe", "type": "${mealType}"}
In English. Only clean JSON.`;
    } else {
      const mealTypeMap: Record<string, string> = {
        breakfast: 'завтрак', lunch: 'обед', dinner: 'ужин', snack: 'перекус',
      };
      prompt = `Ты — профессиональный диетолог. Предложи альтернативное блюдо вместо "${currentMeal?.name ?? ''}" для ${mealTypeMap[mealType] ?? 'приём пищи'}.
Диета: ${profile?.dietaryPreference ?? 'обычное'}
Аллергии: ${allergyList.join(', ') || 'нет'}
Время готовки: до ${profile?.cookingTime ?? '30'} мин
Используй ингредиенты и кухню, характерные для ${regionRu}. Указывай количество ингредиентов в ${unitsRu} (значения БЖУ всегда в граммах).

Ответь строго в JSON:
{"name": "Название", "ingredients": [{"name": "продукт", "amount": "100г"}], "calories": 350, "protein": 20, "fat": 15, "carbs": 30, "cookingTime": 15, "recipe": "Рецепт", "type": "${mealType}"}
На русском языке. Только чистый JSON.`;
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API ключ не настроен' }, { status: 500 });
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Ошибка LLM API' }, { status: 502 });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: 'Нет тела ответа' }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        let partialRead = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  try {
                    const meal = JSON.parse(buffer);
                    await checkAndConsume(session.user.id, 'replace');
                    const finalData = JSON.stringify({ status: 'completed', result: meal });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch {
                    const errData = JSON.stringify({ status: 'error', message: 'Ошибка парсинга' });
                    controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
                  }
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  const progressData = JSON.stringify({ status: 'processing', message: 'Подбираем альтернативу...' });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch { /* skip */ }
              }
            }
          }
          if (buffer) {
            try {
              const meal = JSON.parse(buffer);
              await checkAndConsume(session.user.id, 'replace');
              const finalData = JSON.stringify({ status: 'completed', result: meal });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            } catch {
              const errData = JSON.stringify({ status: 'error', message: 'Ошибка парсинга' });
              controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
            }
          }
          controller.close();
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error: any) {
    console.error('Replace meal error:', error);
    return NextResponse.json({ error: 'Ошибка замены' }, { status: 500 });
  }
}
