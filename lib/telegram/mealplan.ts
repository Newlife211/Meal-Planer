import { prisma } from '@/lib/db';
import { getUsageView, checkAndConsume } from '@/lib/subscription';
import { buildMealPlanPrompt } from '@/lib/meal-plan-prompt';
import { BotLang, L, MEAL_TYPE_LABELS, optLabel } from './i18n';
import { escapeHtml } from './api';

export type GenerateResult =
  | { ok: true; planData: any; planId: string }
  | { ok: false; limitReached: true; limit: number; resetAt: string | null }
  | { ok: false; limitReached: false; error: string };

// Generates a fresh 7-day plan for a user (non-streaming), applying the same
// free-tier gating as the web app.
export async function generatePlanForUser(userId: string, lang: BotLang): Promise<GenerateResult> {
  const usage = await getUsageView(userId);
  if (!usage.isPremium && usage.plans.used >= usage.plans.limit) {
    return { ok: false, limitReached: true, limit: usage.plans.limit, resetAt: usage.plans.resetAt };
  }

  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) return { ok: false, limitReached: false, error: 'NO_API_KEY' };

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const pantryItems = await prisma.pantryItem.findMany({ where: { userId } });
  const prompt = buildMealPlanPrompt(profile, pantryItems, lang);

  try {
    // Use streaming (same as the web app) so long reasoning-model generations
    // do not hit an upstream gateway timeout on a single non-streamed response.
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => 'Unknown error');
      console.error('Bot LLM API error:', response.status, errText);
      return { ok: false, limitReached: false, error: 'LLM_ERROR' };
    }

    // Accumulate the streamed JSON content.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let partial = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      partial += decoder.decode(value, { stream: true });
      const lines = partial.split('\n');
      partial = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? '';
          if (delta) buffer += delta;
        } catch {
          // Ignore keep-alive / non-JSON lines.
        }
      }
    }

    let planData: any;
    try {
      planData = JSON.parse(buffer);
    } catch (e: any) {
      console.error('Bot plan parse error. Buffer length:', buffer.length, 'head:', buffer.slice(0, 200));
      return { ok: false, limitReached: false, error: 'PARSE_ERROR' };
    }
    if (!planData?.days || !Array.isArray(planData.days) || planData.days.length === 0) {
      console.error('Bot empty plan. Keys:', planData ? Object.keys(planData) : 'null');
      return { ok: false, limitReached: false, error: 'EMPTY_PLAN' };
    }

    await prisma.mealPlan.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
    const newPlan = await prisma.mealPlan.create({ data: { userId, planData, isActive: true } });
    await checkAndConsume(userId, 'plan');

    return { ok: true, planData, planId: newPlan.id };
  } catch (e: any) {
    console.error('Bot generate error:', e?.message);
    return { ok: false, limitReached: false, error: 'EXCEPTION' };
  }
}

// ---- On-demand recipe detail + dish image ----

// Generates a realistic photo of the finished dish. Returns raw PNG bytes,
// or null on failure. Only called when the user explicitly taps "recipe with
// photo", so image credits are spent on demand.
export async function generateDishImage(meal: any, lang: BotLang): Promise<Uint8Array | null> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) return null;
  const name = String(meal?.name ?? '').slice(0, 140);
  const ings = (Array.isArray(meal?.ingredients) ? meal.ingredients : [])
    .map((i: any) => i?.name)
    .filter(Boolean)
    .slice(0, 8)
    .join(', ');
  const prompt = `Appetizing, realistic food photography of the finished dish "${name}". Main ingredients: ${ings || 'as appropriate'}. Beautifully plated on a plate or in a bowl, 45-degree or top-down angle, natural soft light, shallow depth of field, restaurant quality. No text, no watermark, no hands.`;
  try {
    const res = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image'],
        image_config: { aspect_ratio: '3:2', num_images: 1 },
      }),
    });
    if (!res.ok) {
      console.error('Dish image error:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json = await res.json();
    const imgs = json?.choices?.[0]?.message?.images ?? json?.choices?.[0]?.delta?.images;
    const url: string = imgs?.[0]?.image_url?.url ?? '';
    if (!url.startsWith('data:')) return null;
    const b64 = url.split(',')[1] ?? '';
    if (!b64) return null;
    return Buffer.from(b64, 'base64');
  } catch (e: any) {
    console.error('Dish image exception:', e?.message);
    return null;
  }
}

// Generates a detailed, numbered step-by-step recipe for a single dish.
// Returns preformatted HTML text ready for Telegram, or null on failure.
export async function generateRecipeDetail(meal: any, lang: BotLang): Promise<string | null> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) return null;
  const name = String(meal?.name ?? '');
  const ings = (Array.isArray(meal?.ingredients) ? meal.ingredients : [])
    .map((i: any) => `${i?.name ?? ''} — ${i?.amount ?? ''}`)
    .join('; ');
  const ct = meal?.cookingTime ? String(meal.cookingTime) : '';
  const prompt =
    lang === 'ru'
      ? `Ты — шеф-повар. Дай подробный пошаговый рецепт блюда "${name}". Ингредиенты: ${ings || 'подбери сам'}. ${ct ? `Ориентировочное время готовки: ${ct} мин.` : ''}\nОтветь строго в JSON: {"steps":["Шаг 1 ...","Шаг 2 ..."],"tip":"короткий полезный совет"}. Сделай 5-9 конкретных шагов простым языком, с температурами и временем где уместно. Только чистый JSON без markdown.`
      : `You are a chef. Give a detailed step-by-step recipe for "${name}". Ingredients: ${ings || 'choose suitable ones'}. ${ct ? `Approx cooking time: ${ct} min.` : ''}\nRespond strictly in JSON: {"steps":["Step 1 ...","Step 2 ..."],"tip":"short useful tip"}. Make 5-9 concrete steps in plain language, with temperatures and times where relevant. Clean JSON only, no markdown.`;
  try {
    const res = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.error('Recipe detail error:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? '';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }
    const steps: string[] = Array.isArray(parsed?.steps) ? parsed.steps : [];
    if (steps.length === 0) return null;
    const lines: string[] = [];
    lines.push(`<b>${L(lang, '👨‍🍳 Как готовить', '👨‍🍳 How to cook')}: ${escapeHtml(name)}</b>`);
    lines.push('');
    steps.forEach((s, i) => lines.push(`<b>${i + 1}.</b> ${escapeHtml(String(s))}`));
    if (parsed?.tip) {
      lines.push('');
      lines.push(`💡 <i>${escapeHtml(String(parsed.tip))}</i>`);
    }
    return lines.join('\n');
  } catch (e: any) {
    console.error('Recipe detail exception:', e?.message);
    return null;
  }
}

// ---- Formatting helpers ----

export function planDays(planData: any): any[] {
  return Array.isArray(planData?.days) ? planData.days : [];
}

function mealTypeLabel(type: string, lang: BotLang): string {
  return optLabel(MEAL_TYPE_LABELS, type, lang);
}

// One line per meal, used inside a day overview.
export function formatDayText(day: any, lang: BotLang): string {
  const meals = Array.isArray(day?.meals) ? day.meals : [];
  const lines: string[] = [`<b>${escapeHtml(day?.day ?? '')}</b>`, ''];
  let totalCal = 0;
  for (const m of meals) {
    const cal = Number(m?.calories) || 0;
    totalCal += cal;
    lines.push(`${mealTypeLabel(m?.type, lang)}: <b>${escapeHtml(m?.name ?? '')}</b> — ${cal} ${L(lang, 'ккал', 'kcal')}`);
  }
  lines.push('');
  lines.push(`🔥 ${L(lang, 'Всего за день', 'Total for the day')}: <b>${totalCal} ${L(lang, 'ккал', 'kcal')}</b>`);
  return lines.join('\n');
}

// Full recipe view for a single meal.
export function formatMealText(meal: any, lang: BotLang): string {
  const ingredients = Array.isArray(meal?.ingredients) ? meal.ingredients : [];
  const lines: string[] = [];
  lines.push(`${mealTypeLabel(meal?.type, lang)}`);
  lines.push(`<b>${escapeHtml(meal?.name ?? '')}</b>`);
  lines.push('');
  lines.push(
    `🔥 ${Number(meal?.calories) || 0} ${L(lang, 'ккал', 'kcal')}  •  ` +
      `${L(lang, 'Б', 'P')} ${Number(meal?.protein) || 0}г  •  ` +
      `${L(lang, 'Ж', 'F')} ${Number(meal?.fat) || 0}г  •  ` +
      `${L(lang, 'У', 'C')} ${Number(meal?.carbs) || 0}г`
  );
  if (meal?.cookingTime) {
    lines.push(`⏱ ${L(lang, 'Время готовки', 'Cooking time')}: ${escapeHtml(String(meal.cookingTime))} ${L(lang, 'мин', 'min')}`);
  }
  lines.push('');
  lines.push(`<b>${L(lang, 'Ингредиенты', 'Ingredients')}:</b>`);
  for (const ing of ingredients) {
    lines.push(`• ${escapeHtml(ing?.name ?? '')} — ${escapeHtml(ing?.amount ?? '')}`);
  }
  if (meal?.recipe) {
    lines.push('');
    lines.push(`<b>${L(lang, 'Рецепт', 'Recipe')}:</b>`);
    lines.push(escapeHtml(String(meal.recipe)));
  }
  return lines.join('\n');
}
