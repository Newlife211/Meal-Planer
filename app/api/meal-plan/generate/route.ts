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

  const body = await request.json().catch(() => ({}));
  const lang: 'en' | 'ru' = body?.lang === 'en' ? 'en' : 'ru';

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });
  const pantryItems = await prisma.pantryItem.findMany({
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
  const currencyMeta: Record<string, { symbol: string; regionEn: string; regionRu: string }> = {
    USD: { symbol: '$', regionEn: 'the United States', regionRu: 'США' },
    GBP: { symbol: '£', regionEn: 'the United Kingdom', regionRu: 'Великобритании' },
    EUR: { symbol: '€', regionEn: 'Europe', regionRu: 'Европы' },
    RUB: { symbol: '₽', regionEn: 'Russia', regionRu: 'России' },
  };
  const curSymbol = currencyMeta[currency]?.symbol ?? '₽';
  const regionEn = currencyMeta[currency]?.regionEn ?? 'Russia';
  const regionRu = currencyMeta[currency]?.regionRu ?? 'России';
  const unitSystem = profile?.unitSystem === 'imperial' ? 'imperial' : 'metric';

  let prompt: string;

  if (lang === 'en') {
    const pantryList = (pantryItems ?? []).map((i: any) => `${i?.name ?? ''} (${i?.quantity ?? 0} ${i?.unit ?? ''})`).join(', ') || 'No items';
    const goalMap: Record<string, string> = { lose: 'weight loss', gain: 'muscle gain', maintain: 'maintain weight' };
    const dietMap: Record<string, string> = { regular: 'regular', vegetarian: 'vegetarian', vegan: 'vegan', gluten_free: 'gluten-free', keto: 'keto' };
    prompt = `You are a professional nutritionist. Build a 7-day meal plan.

User profile:
- Age: ${profile?.age ?? 'not specified'}
- Gender: ${profile?.gender ?? 'not specified'}
- Weight: ${profile?.weight ?? 'not specified'} kg
- Height: ${profile?.height ?? 'not specified'} cm
- Activity: ${profile?.activityLevel ?? 'moderate'}
- Goal: ${goalMap[profile?.goal ?? ''] ?? 'maintain weight'}
- Diet: ${dietMap[profile?.dietaryPreference ?? ''] ?? 'regular'}
- Allergies: ${allergyList.join(', ') || 'none'}
- Budget: ${curSymbol}${profile?.budget ?? 100} per week (assume grocery prices typical of ${regionEn})
- Cooking time: up to ${profile?.cookingTime ?? '30'} min

Pantry items (use them first): ${pantryList}

Use ingredients, dishes and cuisine appropriate for ${regionEn}. Keep the total weekly grocery cost within the stated budget using prices realistic for ${regionEn}.
Express every ingredient amount in ${unitSystem === 'imperial' ? 'US imperial units (ounces "oz", pounds "lb", cups, fluid ounces "fl oz")' : 'metric units (grams "g", kilograms "kg", milliliters "ml")'}. Nutrition values (protein, fat, carbs) stay in grams regardless.

Respond strictly in JSON with this structure:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "breakfast",
          "name": "Dish name",
          "ingredients": [{"name": "item", "amount": "100g"}],
          "calories": 350,
          "protein": 20,
          "fat": 15,
          "carbs": 30,
          "cookingTime": 15,
          "recipe": "Short recipe with step-by-step instructions"
        }
      ]
    }
  ]
}

Meal types: breakfast, lunch, dinner, snack.
All days of the week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
Dish names and recipes in English.
Return only clean JSON without markdown.`;
  } else {
    const pantryList = (pantryItems ?? []).map((i: any) => `${i?.name ?? ''} (${i?.quantity ?? 0} ${i?.unit ?? ''})`).join(', ') || 'Нет продуктов';
    const goalMap: Record<string, string> = { lose: 'похудение', gain: 'набор массы', maintain: 'поддержание веса' };
    const dietMap: Record<string, string> = { regular: 'обычное', vegetarian: 'вегетарианство', vegan: 'веганство', gluten_free: 'безглютеновое', keto: 'кето' };
    prompt = `Ты — профессиональный диетолог. Составь план питания на 7 дней.

Профиль пользователя:
- Возраст: ${profile?.age ?? 'не указан'}
- Пол: ${profile?.gender ?? 'не указан'}
- Вес: ${profile?.weight ?? 'не указан'} кг
- Рост: ${profile?.height ?? 'не указан'} см
- Активность: ${profile?.activityLevel ?? 'умеренная'}
- Цель: ${goalMap[profile?.goal ?? ''] ?? 'поддержание веса'}
- Диета: ${dietMap[profile?.dietaryPreference ?? ''] ?? 'обычное'}
- Аллергии: ${allergyList.join(', ') || 'нет'}
- Бюджет: ${profile?.budget ?? 5000} ${curSymbol}/неделя (ориентируйся на цены продуктов, типичные для ${regionRu})
- Время на готовку: до ${profile?.cookingTime ?? '30'} мин

Продукты в кладовой (используй их в первую очередь): ${pantryList}

Используй ингредиенты, блюда и кухню, характерные для ${regionRu}. Уложись в указанный недельный бюджет, используя реалистичные для ${regionRu} цены.
Указывай количество каждого ингредиента в ${unitSystem === 'imperial' ? 'имперских единицах США (унции "oz", фунты "lb", чашки, жидкие унции "fl oz")' : 'метрических единицах (граммы "г", килограммы "кг", миллилитры "мл")'}. Значения БЖУ (белки, жиры, углеводы) всегда в граммах.

Ответь строго в JSON формате с такой структурой:
{
  "days": [
    {
      "day": "Понедельник",
      "meals": [
        {
          "type": "breakfast",
          "name": "Название блюда",
          "ingredients": [{"name": "продукт", "amount": "100г"}],
          "calories": 350,
          "protein": 20,
          "fat": 15,
          "carbs": 30,
          "cookingTime": 15,
          "recipe": "Краткий рецепт с пошаговыми инструкциями"
        }
      ]
    }
  ]
}

Типы приёмов пищи: breakfast (завтрак), lunch (обед), dinner (ужин), snack (перекус).
Все дни недели: Понедельник, Вторник, Среда, Четверг, Пятница, Суббота, Воскресенье.
Названия блюд и рецепты на русском языке.
Отвечай только чистым JSON без маркдауна.`;
  }

  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API ключ не настроен' }, { status: 500 });
  }

  // Free-tier gating: limit weekly plan generations for non-premium users.
  const usage = await getUsageView(session.user.id);
  if (!usage.isPremium && usage.plans.used >= usage.plans.limit) {
    return NextResponse.json(
      {
        error: 'LIMIT_REACHED',
        code: 'LIMIT_REACHED',
        kind: 'plan',
        limit: usage.plans.limit,
        resetAt: usage.plans.resetAt,
      },
      { status: 403 }
    );
  }

  try {
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
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      console.error('LLM API error:', errText);
      return NextResponse.json({ error: 'Ошибка LLM API' }, { status: 502 });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: 'Нет тела ответа' }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const userId = session.user.id;

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
                    const planData = JSON.parse(buffer);
                    // Deactivate old plans
                    await prisma.mealPlan.updateMany({
                      where: { userId, isActive: true },
                      data: { isActive: false },
                    });
                    // Save new plan
                    const newPlan = await prisma.mealPlan.create({
                      data: {
                        userId,
                        planData,
                        isActive: true,
                      },
                    });
                    await checkAndConsume(userId, 'plan');
                    const finalData = JSON.stringify({
                      status: 'completed',
                      result: planData,
                      planId: newPlan.id,
                    });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch (parseErr: any) {
                    console.error('JSON parse error:', parseErr);
                    const errData = JSON.stringify({ status: 'error', message: 'Ошибка парсинга ответа AI' });
                    controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
                  }
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  const progressData = JSON.stringify({
                    status: 'processing',
                    message: 'AI составляет ваш план...',
                  });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
          // If we exit the loop without [DONE], try to parse what we have
          if (buffer) {
            try {
              const planData = JSON.parse(buffer);
              await prisma.mealPlan.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
              });
              const newPlan = await prisma.mealPlan.create({
                data: { userId, planData, isActive: true },
              });
              await checkAndConsume(userId, 'plan');
              const finalData = JSON.stringify({
                status: 'completed',
                result: planData,
                planId: newPlan.id,
              });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            } catch {
              const errData = JSON.stringify({ status: 'error', message: 'Ошибка парсинга ответа AI' });
              controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
            }
          }
          controller.close();
        } catch (error: any) {
          console.error('Stream error:', error);
          const errData = JSON.stringify({ status: 'error', message: 'Ошибка стриминга' });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Ошибка генерации плана' }, { status: 500 });
  }
}
