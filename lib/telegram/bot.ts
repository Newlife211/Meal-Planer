import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getUsageView } from '@/lib/subscription';
import { PLANS } from '@/lib/stripe';
import {
  sendMessage,
  sendPhoto,
  sendPhotoBytes,
  answerCallbackQuery,
  sendChatAction,
  inlineKeyboard,
  escapeHtml,
  InlineButton,
} from './api';
import {
  ensureChat,
  setStep,
  setStepAndDraft,
  setDraft,
  resetFlow,
  setLang,
  linkUser,
  unlinkUser,
  getLinkedUser,
  ChatState,
} from './state';
import {
  BotLang,
  L,
  GOAL_LABELS,
  DIET_LABELS,
  ACTIVITY_LABELS,
  GENDER_LABELS,
  ALLERGY_LABELS,
  CURRENCY_LABELS,
  optLabel,
} from './i18n';
import {
  generatePlanForUser,
  planDays,
  formatDayText,
  formatMealText,
  generateDishImage,
  generateRecipeDetail,
} from './mealplan';
import { createCheckoutLink, createPortalLink } from './billing';
import { emailAdminNewTicket, notifyAdminNewTicket } from './notify';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string | null, lang: BotLang): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function mainMenuKeyboard(lang: BotLang) {
  return inlineKeyboard([
    [
      { text: L(lang, '🍽 Мой план', '🍽 My plan'), callback_data: 'myplan' },
      { text: L(lang, '✨ Новый план', '✨ New plan'), callback_data: 'newplan' },
    ],
    [
      { text: L(lang, '🧃 Кладовая', '🧃 Pantry'), callback_data: 'pantry' },
      { text: L(lang, '🛒 Покупки', '🛒 Shopping'), callback_data: 'shop' },
    ],
    [
      { text: L(lang, '📜 История', '📜 History'), callback_data: 'history' },
      { text: L(lang, '👤 Профиль', '👤 Profile'), callback_data: 'profile' },
    ],
    [
      { text: L(lang, '💎 Подписка', '💎 Subscription'), callback_data: 'sub' },
      { text: L(lang, '🆘 Поддержка', '🆘 Support'), callback_data: 'support' },
    ],
    [{ text: L(lang, '🌐 Язык / Language', '🌐 Language / Язык'), callback_data: 'lang' }],
  ]);
}

function backToMenuKb(lang: BotLang) {
  return inlineKeyboard([[{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]]);
}

async function showMainMenu(chatId: string, lang: BotLang, name?: string | null) {
  const hi = name ? `, ${escapeHtml(name)}` : '';
  const text =
    L(
      lang,
      `🍽 <b>Eatwise</b>${hi}!\n\nВыберите раздел:`,
      `🍽 <b>Eatwise</b>${hi}!\n\nChoose a section:`
    );
  await sendMessage(chatId, text, { reply_markup: mainMenuKeyboard(lang) });
}

// Public branded image shown in the welcome card. Served from the app's own
// /landing folder (whitelisted in middleware) at the runtime deployment URL.
const WELCOME_IMAGE_URL = `${process.env.NEXTAUTH_URL || ('https://' + 'eatwise' + '.abacusai.app')}/landing/hero.png`;

async function showLanguageIntro(chatId: string) {
  await sendMessage(
    chatId,
    '🌐 <b>Выберите язык / Choose your language</b>',
    {
      reply_markup: inlineKeyboard([
        [
          { text: '🇷🇺 Русский', callback_data: 'lang_set:ru' },
          { text: '🇬🇧 English', callback_data: 'lang_set:en' },
        ],
      ]),
    }
  );
}

async function showWelcome(chatId: string, lang: BotLang) {
  const caption = L(
    lang,
    '🍽 <b>Eatwise — ваш умный ИИ-планировщик питания</b>\n\nПерсональное меню на неделю, список покупок и рецепты — всего за пару минут. Ешьте вкусно, экономьте время и деньги.\n\n👇 Начните прямо сейчас — это бесплатно!',
    '🍽 <b>Eatwise — your smart AI meal planner</b>\n\nA personalized weekly menu, shopping list and recipes — in just a couple of minutes. Eat well, save time and money.\n\n👇 Get started now — it’s free!'
  );
  const kb = inlineKeyboard([
    [
      { text: L(lang, '📝 Регистрация', '📝 Sign up'), callback_data: 'register' },
      { text: L(lang, '🔑 Войти', '🔑 Log in'), callback_data: 'login' },
    ],
    [{ text: L(lang, '🌐 Язык / Language', '🌐 Language / Язык'), callback_data: 'lang' }],
  ]);
  const photo = await sendPhoto(chatId, WELCOME_IMAGE_URL, caption, { reply_markup: kb });
  // Fallback to a plain text card if the photo could not be delivered.
  if (!photo?.ok) {
    await sendMessage(chatId, caption, { reply_markup: kb });
  }
}

// ------------------------------------------------------------------
// Onboarding engine
// ------------------------------------------------------------------

type ObStep =
  | { key: string; type: 'choice'; options: string[]; labels: Record<string, { ru: string; en: string }>; q: [string, string] }
  | { key: string; type: 'multi'; options: string[]; labels: Record<string, { ru: string; en: string }>; q: [string, string] }
  | { key: string; type: 'number'; q: [string, string] };

const ONBOARDING: ObStep[] = [
  { key: 'goal', type: 'choice', options: ['lose', 'maintain', 'gain'], labels: GOAL_LABELS, q: ['Какая у вас цель?', 'What is your goal?'] },
  { key: 'dietaryPreference', type: 'choice', options: ['regular', 'vegetarian', 'vegan', 'gluten_free', 'keto'], labels: DIET_LABELS, q: ['Тип питания?', 'Diet type?'] },
  { key: 'allergies', type: 'multi', options: ['Nuts', 'Dairy', 'Eggs', 'Seafood', 'Gluten', 'Citrus', 'Other'], labels: ALLERGY_LABELS, q: ['Аллергии? (отметьте и нажмите «Готово»)', 'Allergies? (toggle, then press “Done”)'] },
  { key: 'gender', type: 'choice', options: ['male', 'female'], labels: GENDER_LABELS, q: ['Ваш пол?', 'Your gender?'] },
  { key: 'age', type: 'number', q: ['Введите возраст (лет):', 'Enter your age (years):'] },
  { key: 'weight', type: 'number', q: ['Введите вес (кг):', 'Enter your weight (kg):'] },
  { key: 'height', type: 'number', q: ['Введите рост (см):', 'Enter your height (cm):'] },
  { key: 'activityLevel', type: 'choice', options: ['low', 'moderate', 'high'], labels: ACTIVITY_LABELS, q: ['Уровень активности?', 'Activity level?'] },
  { key: 'currency', type: 'choice', options: ['RUB', 'USD', 'EUR', 'GBP'], labels: CURRENCY_LABELS, q: ['В какой валюте ваш бюджет на продукты? (это не оплата подписки)', 'Currency for your grocery budget? (this is not the subscription fee)'] },
  { key: 'budget', type: 'number', q: ['Недельный бюджет на продукты для меню (только число):', 'Weekly grocery budget for your menu (number only):'] },
  { key: 'cookingTime', type: 'choice', options: ['15-30', '30-45', '45-60', '60+'], labels: { '15-30': { ru: 'от 15 до 30 мин', en: '15–30 min' }, '30-45': { ru: 'от 30 до 45 мин', en: '30–45 min' }, '45-60': { ru: 'от 45 мин до 1 часа', en: '45–60 min' }, '60+': { ru: 'от 1 часа и более', en: '1 hour or more' } }, q: ['Сколько времени готовы тратить на готовку?', 'How much time can you spend cooking?'] },
  { key: 'unitSystem', type: 'choice', options: ['metric', 'imperial'], labels: { metric: { ru: 'Метрическая (г, кг)', en: 'Metric (g, kg)' }, imperial: { ru: 'Имперская (oz, lb)', en: 'Imperial (oz, lb)' } }, q: ['Система единиц?', 'Unit system?'] },
];

async function askOnboarding(chatId: string, lang: BotLang, index: number, draft: Record<string, any>) {
  const step = ONBOARDING[index];
  const progress = `(${index + 1}/${ONBOARDING.length}) `;
  const q = progress + L(lang, step.q[0], step.q[1]);
  if (step.type === 'number') {
    await sendMessage(chatId, q);
    return;
  }
  if (step.type === 'choice') {
    const rows: InlineButton[][] = step.options.map((o) => [
      { text: optLabel(step.labels, o, lang), callback_data: `obset:${index}:${o}` },
    ]);
    await sendMessage(chatId, q, { reply_markup: inlineKeyboard(rows) });
    return;
  }
  // multi
  const selected: string[] = Array.isArray(draft.allergies) ? draft.allergies : [];
  const rows: InlineButton[][] = step.options.map((o) => [
    {
      text: `${selected.includes(o) ? '✅ ' : ''}${optLabel(step.labels, o, lang)}`,
      callback_data: `obtog:${index}:${o}`,
    },
  ]);
  rows.push([{ text: L(lang, '✓ Готово', '✓ Done'), callback_data: `obnext:${index}` }]);
  await sendMessage(chatId, q, { reply_markup: inlineKeyboard(rows) });
}

async function startOnboarding(chatId: string, lang: BotLang) {
  await setStepAndDraft(chatId, 'ob:0', { allergies: [] });
  await sendMessage(
    chatId,
    L(lang, '📝 Давайте настроим ваш профиль питания.', '📝 Let\'s set up your nutrition profile.')
  );
  await askOnboarding(chatId, lang, 0, { allergies: [] });
}

async function finishOnboarding(chatId: string, userId: string, lang: BotLang, draft: Record<string, any>) {
  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      age: draft.age ?? undefined,
      gender: draft.gender ?? undefined,
      weight: draft.weight ?? undefined,
      height: draft.height ?? undefined,
      activityLevel: draft.activityLevel ?? undefined,
      goal: draft.goal ?? undefined,
      dietaryPreference: draft.dietaryPreference ?? undefined,
      allergies: draft.allergies ?? [],
      budget: draft.budget ?? undefined,
      currency: draft.currency ?? undefined,
      unitSystem: draft.unitSystem ?? undefined,
      cookingTime: draft.cookingTime ?? undefined,
      onboardingDone: true,
    },
    create: {
      userId,
      age: draft.age,
      gender: draft.gender,
      weight: draft.weight,
      height: draft.height,
      activityLevel: draft.activityLevel,
      goal: draft.goal,
      dietaryPreference: draft.dietaryPreference,
      allergies: draft.allergies ?? [],
      budget: draft.budget,
      currency: draft.currency ?? 'RUB',
      unitSystem: draft.unitSystem ?? 'metric',
      cookingTime: draft.cookingTime,
      onboardingDone: true,
    },
  });
  await resetFlow(chatId);
  await sendMessage(
    chatId,
    L(lang, '✅ Профиль сохранён! Теперь можно создать план питания.', '✅ Profile saved! Now you can generate a meal plan.'),
    {
      reply_markup: inlineKeyboard([
        [{ text: L(lang, '✨ Создать план', '✨ Generate plan'), callback_data: 'newplan' }],
        [{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }],
      ]),
    }
  );
}

// ------------------------------------------------------------------
// Feature views
// ------------------------------------------------------------------

async function viewPlanDay(chatId: string, lang: BotLang, dayIndex: number) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const plan = await prisma.mealPlan.findFirst({ where: { userId: user.id, isActive: true }, orderBy: { createdAt: 'desc' } });
  if (!plan) {
    await sendMessage(chatId, L(lang, 'У вас пока нет плана. Создайте новый!', 'You have no plan yet. Generate one!'), {
      reply_markup: inlineKeyboard([[{ text: L(lang, '✨ Создать план', '✨ Generate plan'), callback_data: 'newplan' }], [{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]]),
    });
    return;
  }
  const days = planDays(plan.planData);
  if (days.length === 0) {
    await sendMessage(chatId, L(lang, 'План пуст. Попробуйте создать заново.', 'Plan is empty. Try regenerating.'), { reply_markup: backToMenuKb(lang) });
    return;
  }
  const idx = Math.max(0, Math.min(dayIndex, days.length - 1));
  const day = days[idx];
  const meals = Array.isArray(day?.meals) ? day.meals : [];
  const mealRow: InlineButton[] = meals.map((m: any, mi: number) => ({
    text: optLabelShort(m?.type, lang),
    callback_data: `meal:${idx}:${mi}`,
  }));
  const nav: InlineButton[] = [];
  if (idx > 0) nav.push({ text: '⬅️', callback_data: `day:${idx - 1}` });
  nav.push({ text: `${idx + 1}/${days.length}`, callback_data: 'noop' });
  if (idx < days.length - 1) nav.push({ text: '➡️', callback_data: `day:${idx + 1}` });
  const rows: InlineButton[][] = [];
  // chunk meal buttons two per row
  for (let i = 0; i < mealRow.length; i += 2) rows.push(mealRow.slice(i, i + 2));
  rows.push(nav);
  rows.push([{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]);
  await sendMessage(chatId, formatDayText(day, lang), { reply_markup: inlineKeyboard(rows) });
}

function optLabelShort(type: string, lang: BotLang): string {
  const map: Record<string, [string, string]> = {
    breakfast: ['🌾 Завтрак', '🌾 Breakfast'],
    lunch: ['🍲 Обед', '🍲 Lunch'],
    dinner: ['🍽 Ужин', '🍽 Dinner'],
    snack: ['🍎 Перекус', '🍎 Snack'],
  };
  const p = map[type];
  return p ? L(lang, p[0], p[1]) : type;
}

async function viewMeal(chatId: string, lang: BotLang, dayIndex: number, mealIndex: number) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const plan = await prisma.mealPlan.findFirst({ where: { userId: user.id, isActive: true }, orderBy: { createdAt: 'desc' } });
  const days = planDays(plan?.planData);
  const day = days[dayIndex];
  const meal = Array.isArray(day?.meals) ? day.meals[mealIndex] : null;
  if (!meal) {
    await sendMessage(chatId, L(lang, 'Блюдо не найдено.', 'Meal not found.'), { reply_markup: backToMenuKb(lang) });
    return;
  }
  await sendMessage(chatId, formatMealText(meal, lang), {
    reply_markup: inlineKeyboard([
      [{ text: L(lang, '👨‍🍳 Рецепт с фото', '👨‍🍳 Recipe with photo'), callback_data: `recipe:${dayIndex}:${mealIndex}` }],
      [{ text: L(lang, '⬅️ К дню', '⬅️ Back to day'), callback_data: `day:${dayIndex}` }],
    ]),
  });
}

// Generates (on demand) a detailed step-by-step recipe plus a photo of the
// finished dish, then sends both to the user.
async function viewRecipe(chatId: string, lang: BotLang, dayIndex: number, mealIndex: number) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const plan = await prisma.mealPlan.findFirst({ where: { userId: user.id, isActive: true }, orderBy: { createdAt: 'desc' } });
  const days = planDays(plan?.planData);
  const day = days[dayIndex];
  const meal = Array.isArray(day?.meals) ? day.meals[mealIndex] : null;
  if (!meal) {
    await sendMessage(chatId, L(lang, 'Блюдо не найдено.', 'Meal not found.'), { reply_markup: backToMenuKb(lang) });
    return;
  }
  await sendMessage(
    chatId,
    L(lang, '👨‍🍳 Готовлю подробный рецепт и фото блюда... Это займёт около минуты.', '👨‍🍳 Preparing a detailed recipe and a dish photo... This takes about a minute.')
  );
  await sendChatAction(chatId, 'upload_photo');
  const [img, detail] = await Promise.all([
    generateDishImage(meal, lang),
    generateRecipeDetail(meal, lang),
  ]);
  const backKb = inlineKeyboard([[{ text: L(lang, '⬅️ К дню', '⬅️ Back to day'), callback_data: `day:${dayIndex}` }]]);
  if (img) {
    await sendPhotoBytes(chatId, img, `<b>${escapeHtml(String(meal?.name ?? ''))}</b>`);
  }
  if (detail) {
    await sendMessage(chatId, detail, { reply_markup: backKb });
  } else {
    // Fall back to the short recipe already stored in the plan.
    await sendMessage(chatId, formatMealText(meal, lang), { reply_markup: backKb });
  }
}

async function viewPantry(chatId: string, lang: BotLang) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const items = await prisma.pantryItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  const lines: string[] = [`🧃 <b>${L(lang, 'Кладовая', 'Pantry')}</b>`, ''];
  if (items.length === 0) lines.push(L(lang, 'Пока пусто.', 'Empty for now.'));
  else for (const it of items) lines.push(`• ${escapeHtml(it.name)} — ${it.quantity} ${escapeHtml(it.unit)}`);
  const rows: InlineButton[][] = [[{ text: L(lang, '➕ Добавить', '➕ Add'), callback_data: 'pantry_add' }]];
  for (const it of items.slice(0, 10)) {
    rows.push([{ text: `🗑 ${it.name}`, callback_data: `pantry_del:${it.id}` }]);
  }
  rows.push([{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]);
  await sendMessage(chatId, lines.join('\n'), { reply_markup: inlineKeyboard(rows) });
}

async function viewShoppingList(chatId: string, lang: BotLang) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const plan = await prisma.mealPlan.findFirst({ where: { userId: user.id, isActive: true }, orderBy: { createdAt: 'desc' } });
  if (!plan) {
    await sendMessage(chatId, L(lang, 'Сначала создайте план питания.', 'Generate a meal plan first.'), { reply_markup: backToMenuKb(lang) });
    return;
  }
  const pantry = await prisma.pantryItem.findMany({ where: { userId: user.id } });
  const pantryNames = new Set(pantry.map((i: any) => (i.name || '').toLowerCase()));
  const map = new Map<string, string>();
  for (const day of planDays(plan.planData)) {
    for (const meal of (Array.isArray(day?.meals) ? day.meals : [])) {
      for (const ing of (Array.isArray(meal?.ingredients) ? meal.ingredients : [])) {
        const name = (ing?.name ?? '').toString();
        const key = name.toLowerCase();
        if (!key || pantryNames.has(key)) continue;
        const amount = (ing?.amount ?? '').toString();
        map.set(key, map.has(key) ? `${map.get(key)}, ${amount}` : amount);
      }
    }
  }
  const lines: string[] = [`🛒 <b>${L(lang, 'Список покупок', 'Shopping list')}</b>`, ''];
  if (map.size === 0) lines.push(L(lang, 'Всё есть в кладовой! 🎉', 'Everything is in your pantry! 🎉'));
  else {
    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [name, amount] of sorted) {
      const disp = name.charAt(0).toUpperCase() + name.slice(1);
      lines.push(`☐ ${escapeHtml(disp)} — ${escapeHtml(amount)}`);
    }
  }
  await sendMessage(chatId, lines.join('\n'), { reply_markup: backToMenuKb(lang) });
}

async function viewHistory(chatId: string, lang: BotLang) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const plans = await prisma.mealPlan.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 10 });
  const lines: string[] = [`📜 <b>${L(lang, 'История планов', 'Plan history')}</b>`, ''];
  if (plans.length === 0) lines.push(L(lang, 'Пока нет планов.', 'No plans yet.'));
  const rows: InlineButton[][] = [];
  for (const p of plans) {
    const active = p.isActive ? (lang === 'en' ? ' ✅ active' : ' ✅ активный') : '';
    lines.push(`• ${fmtDate(p.createdAt.toISOString(), lang)}${active}`);
    if (!p.isActive) rows.push([{ text: `⭐ ${fmtDate(p.createdAt.toISOString(), lang)}`, callback_data: `history_use:${p.id}` }]);
  }
  rows.push([{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]);
  await sendMessage(chatId, lines.join('\n'), { reply_markup: inlineKeyboard(rows) });
}

async function viewProfile(chatId: string, lang: BotLang) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const p = user.profile;
  const lines: string[] = [`👤 <b>${L(lang, 'Профиль', 'Profile')}</b>`, ''];
  lines.push(`📧 ${escapeHtml(user.email)}`);
  if (p) {
    const allergies = (Array.isArray(p.allergies) ? p.allergies : []).map((a: any) => optLabel(ALLERGY_LABELS, a, lang)).join(', ') || L(lang, 'нет', 'none');
    lines.push(`🎯 ${L(lang, 'Цель', 'Goal')}: ${optLabel(GOAL_LABELS, p.goal || '', lang)}`);
    lines.push(`🥗 ${L(lang, 'Диета', 'Diet')}: ${optLabel(DIET_LABELS, p.dietaryPreference || '', lang)}`);
    lines.push(`⚠️ ${L(lang, 'Аллергии', 'Allergies')}: ${allergies}`);
    lines.push(`💰 ${L(lang, 'Бюджет', 'Budget')}: ${p.budget ?? '—'} ${p.currency ?? ''}`);
    lines.push(`⏱ ${L(lang, 'Время готовки', 'Cooking time')}: ${p.cookingTime ?? '—'} ${L(lang, 'мин', 'min')}`);
  } else {
    lines.push(L(lang, 'Профиль ещё не заполнен.', 'Profile is not set up yet.'));
  }
  await sendMessage(chatId, lines.join('\n'), {
    reply_markup: inlineKeyboard([
      [{ text: L(lang, '✏️ Изменить профиль', '✏️ Edit profile'), callback_data: 'onboard' }],
      [{ text: L(lang, '🚪 Выйти', '🚪 Log out'), callback_data: 'logout' }],
      [{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }],
    ]),
  });
}

async function viewSubscription(chatId: string, lang: BotLang) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const usage = await getUsageView(user.id);
  const lines: string[] = [`💎 <b>${L(lang, 'Подписка', 'Subscription')}</b>`, ''];
  if (usage.isPremium) {
    if (usage.status === 'trialing') {
      lines.push(`✅ <b>Premium</b> — ${L(lang, 'пробный период', 'free trial')}`);
      lines.push(`${L(lang, 'Бесплатно до', 'Free until')}: ${fmtDate(usage.periodEnd, lang)}`);
      lines.push(L(lang, 'Далее автосписание. Отменить можно в любой момент.', 'Then auto-renews. Cancel anytime.'));
    } else {
      lines.push(`✅ <b>Premium</b>`);
      lines.push(`${L(lang, 'Действует до', 'Active until')}: ${fmtDate(usage.periodEnd, lang)}`);
    }
  } else {
    lines.push(`🆓 <b>${L(lang, 'Бесплатный тариф', 'Free plan')}</b>`);
    lines.push('');
    lines.push(`${L(lang, 'Планы питания', 'Meal plans')}: ${usage.plans.used}/${usage.plans.limit} ${L(lang, 'в неделю', 'per week')}`);
    lines.push(`${L(lang, 'Замены блюд/ингредиентов', 'Replacements')}: ${usage.replaces.used}/${usage.replaces.limit} ${L(lang, 'в месяц', 'per month')}`);
    lines.push('');
    lines.push(`⭐ <b>Premium</b> — ${L(lang, 'безлимитные планы и замены', 'unlimited plans & replacements')}`);
    lines.push(`• ${fmtMoney(PLANS.monthly.amount)} / ${L(lang, 'месяц', 'month')}`);
    lines.push(`• ${fmtMoney(PLANS.yearly.amount)} / ${L(lang, 'год', 'year')}`);
    lines.push('');
    lines.push(L(lang, '🎁 Первые 7 дней бесплатно. Списание начнётся только после пробного периода — отменить можно в любой момент.', '🎁 First 7 days free. You are charged only after the trial ends — cancel anytime.'));
  }
  const rows: InlineButton[][] = [];
  if (usage.isPremium) {
    rows.push([{ text: L(lang, '⚙️ Управлять подпиской', '⚙️ Manage subscription'), callback_data: 'sub_manage' }]);
  } else {
    rows.push([{ text: L(lang, `💎 ${fmtMoney(PLANS.monthly.amount)}/мес`, `💎 ${fmtMoney(PLANS.monthly.amount)}/mo`), callback_data: 'sub_buy:monthly' }]);
    rows.push([{ text: L(lang, `💎 ${fmtMoney(PLANS.yearly.amount)}/год`, `💎 ${fmtMoney(PLANS.yearly.amount)}/yr`), callback_data: 'sub_buy:yearly' }]);
  }
  rows.push([{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]);
  await sendMessage(chatId, lines.join('\n'), { reply_markup: inlineKeyboard(rows) });
}

async function viewSupport(chatId: string, lang: BotLang) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  const statusLabel = (s: string) =>
    s === 'answered' ? L(lang, 'отвечено', 'answered') : s === 'closed' ? L(lang, 'закрыто', 'closed') : L(lang, 'открыто', 'open');
  const lines: string[] = [`🆘 <b>${L(lang, 'Поддержка', 'Support')}</b>`, ''];
  if (tickets.length === 0) lines.push(L(lang, 'У вас пока нет обращений.', 'You have no requests yet.'));
  const rows: InlineButton[][] = [[{ text: L(lang, '➕ Новое обращение', '➕ New request'), callback_data: 'support_new' }]];
  for (const t of tickets) {
    rows.push([{ text: `💬 ${t.subject.slice(0, 40)} — ${statusLabel(t.status)}`, callback_data: `support_view:${t.id}` }]);
  }
  rows.push([{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]);
  await sendMessage(chatId, lines.join('\n'), { reply_markup: inlineKeyboard(rows) });
}

async function viewTicket(chatId: string, lang: BotLang, ticketId: string) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket) {
    await sendMessage(chatId, L(lang, 'Обращение не найдено.', 'Request not found.'), { reply_markup: backToMenuKb(lang) });
    return;
  }
  const lines: string[] = [`🆘 <b>${escapeHtml(ticket.subject)}</b>`, ''];
  for (const m of ticket.messages) {
    const who = m.isAdmin ? L(lang, '🛠 Поддержка', '🛠 Support') : L(lang, '👤 Вы', '👤 You');
    lines.push(`<b>${who}:</b>`);
    lines.push(escapeHtml(m.body));
    lines.push('');
  }
  const rows: InlineButton[][] = [];
  if (ticket.status !== 'closed') {
    rows.push([{ text: L(lang, '✍️ Ответить', '✍️ Reply'), callback_data: `support_reply:${ticket.id}` }]);
  }
  rows.push([{ text: L(lang, '⬅️ К обращениям', '⬅️ Back'), callback_data: 'support' }]);
  await sendMessage(chatId, lines.join('\n'), { reply_markup: inlineKeyboard(rows) });
}

async function promptLogin(chatId: string, lang: BotLang) {
  await sendMessage(chatId, L(lang, 'Сначала войдите в аккаунт.', 'Please log in first.'), {
    reply_markup: inlineKeyboard([
      [
        { text: L(lang, '🔑 Войти', '🔑 Log in'), callback_data: 'login' },
        { text: L(lang, '📝 Регистрация', '📝 Sign up'), callback_data: 'register' },
      ],
    ]),
  });
}

async function requireOnboarded(chatId: string, lang: BotLang, user: any): Promise<boolean> {
  if (user?.profile?.onboardingDone) return true;
  await sendMessage(chatId, L(lang, 'Сначала заполните профиль питания.', 'Please set up your nutrition profile first.'), {
    reply_markup: inlineKeyboard([[{ text: L(lang, '📝 Заполнить', '📝 Set up'), callback_data: 'onboard' }]]),
  });
  return false;
}

async function doGeneratePlan(chatId: string, lang: BotLang) {
  const user = await getLinkedUser(chatId);
  if (!user) return promptLogin(chatId, lang);
  if (!(await requireOnboarded(chatId, lang, user))) return;
  await sendChatAction(chatId, 'typing');
  await sendMessage(chatId, L(lang, '✨ Генерирую ваш план питания… Это займёт около минуты.', '✨ Generating your meal plan… This takes about a minute.'));
  const res = await generatePlanForUser(user.id, lang);
  if (res.ok) {
    await sendMessage(chatId, L(lang, '✅ План на 7 дней готов!', '✅ Your 7-day plan is ready!'));
    await viewPlanDay(chatId, lang, 0);
    return;
  }
  if (res.limitReached) {
    await sendMessage(
      chatId,
      L(
        lang,
        `⚠️ Достигнут лимит бесплатного тарифа (${res.limit} план в неделю).\nОбновление: ${fmtDate(res.resetAt, lang)}.\n\nОформите Premium для безлимитной генерации.`,
        `⚠️ Free plan limit reached (${res.limit} plan/week).\nResets: ${fmtDate(res.resetAt, lang)}.\n\nUpgrade to Premium for unlimited generation.`
      ),
      { reply_markup: inlineKeyboard([[{ text: L(lang, '💎 Оформить Premium', '💎 Get Premium'), callback_data: 'sub' }], [{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]]) }
    );
    return;
  }
  await sendMessage(chatId, L(lang, '❌ Не удалось создать план. Попробуйте позже.', '❌ Could not generate the plan. Please try again later.'), { reply_markup: backToMenuKb(lang) });
}

// ------------------------------------------------------------------
// Callback handling
// ------------------------------------------------------------------

async function handleCallback(cq: any) {
  const chatId = String(cq.from?.id ?? cq.message?.chat?.id ?? '');
  if (!chatId) return;
  const data: string = cq.data ?? '';
  const chat = await ensureChat(chatId, cq.from?.language_code);
  const lang = chat.lang;
  await answerCallbackQuery(cq.id).catch(() => {});

  const [cmd, a, b] = data.split(':');

  // Auth-related callbacks that work without a linked user
  if (cmd === 'noop') return;
  if (cmd === 'menu') {
    const user = await getLinkedUser(chatId);
    if (!user) {
      return showWelcome(chatId, lang);
    }
    await resetFlow(chatId);
    return showMainMenu(chatId, lang, user.name);
  }
  if (cmd === 'lang') {
    return sendMessage(chatId, '🌐 Язык / Language', {
      reply_markup: inlineKeyboard([
        [{ text: '🇷🇺 Русский', callback_data: 'lang_set:ru' }, { text: '🇬🇧 English', callback_data: 'lang_set:en' }],
      ]),
    });
  }
  if (cmd === 'lang_set') {
    const newLang: BotLang = a === 'en' ? 'en' : 'ru';
    await setLang(chatId, newLang);
    const user = await getLinkedUser(chatId);
    if (!user) return showWelcome(chatId, newLang);
    return showMainMenu(chatId, newLang, user.name);
  }
  if (cmd === 'login') {
    await setStepAndDraft(chatId, 'login_email', {});
    return sendMessage(chatId, L(lang, 'Введите email вашего аккаунта Eatwise:', 'Enter your Eatwise account email:'));
  }
  if (cmd === 'register') {
    await setStepAndDraft(chatId, 'reg_email', {});
    return sendMessage(chatId, L(lang, 'Введите email для нового аккаунта:', 'Enter an email for your new account:'));
  }
  if (cmd === 'logout') {
    await unlinkUser(chatId);
    return showWelcome(chatId, lang);
  }
  if (cmd === 'onboard') {
    const user = await getLinkedUser(chatId);
    if (!user) return promptLogin(chatId, lang);
    return startOnboarding(chatId, lang);
  }

  // Onboarding choice/multi callbacks
  if (cmd === 'obset') {
    const idx = parseInt(a, 10);
    const step = ONBOARDING[idx];
    if (!step || (chat.step ?? '') !== `ob:${idx}`) return;
    const draft = { ...chat.draft };
    draft[step.key] = step.key === 'cookingTime' ? b : b;
    return advanceOnboarding(chatId, lang, idx, draft);
  }
  if (cmd === 'obtog') {
    const idx = parseInt(a, 10);
    if ((chat.step ?? '') !== `ob:${idx}`) return;
    const draft = { ...chat.draft };
    const arr: string[] = Array.isArray(draft.allergies) ? draft.allergies : [];
    draft.allergies = arr.includes(b) ? arr.filter((x) => x !== b) : [...arr, b];
    await setDraft(chatId, draft);
    return askOnboarding(chatId, lang, idx, draft);
  }
  if (cmd === 'obnext') {
    const idx = parseInt(a, 10);
    if ((chat.step ?? '') !== `ob:${idx}`) return;
    return advanceOnboarding(chatId, lang, idx, { ...chat.draft });
  }

  // Feature callbacks (require linked user; individual views re-check)
  switch (cmd) {
    case 'newplan':
      return doGeneratePlan(chatId, lang);
    case 'myplan':
      return viewPlanDay(chatId, lang, 0);
    case 'day':
      return viewPlanDay(chatId, lang, parseInt(a, 10) || 0);
    case 'meal':
      return viewMeal(chatId, lang, parseInt(a, 10) || 0, parseInt(b, 10) || 0);
    case 'recipe':
      return viewRecipe(chatId, lang, parseInt(a, 10) || 0, parseInt(b, 10) || 0);
    case 'pantry':
      return viewPantry(chatId, lang);
    case 'pantry_add': {
      const user = await getLinkedUser(chatId);
      if (!user) return promptLogin(chatId, lang);
      await setStep(chatId, 'pantry_add');
      return sendMessage(chatId, L(lang, 'Введите продукт в формате: <i>название количество единица</i>\nНапример: <code>Куриное филе 500 г</code>', 'Send an item as: <i>name quantity unit</i>\nExample: <code>Chicken breast 500 g</code>'));
    }
    case 'pantry_del': {
      const user = await getLinkedUser(chatId);
      if (!user) return promptLogin(chatId, lang);
      await prisma.pantryItem.deleteMany({ where: { id: a, userId: user.id } });
      return viewPantry(chatId, lang);
    }
    case 'shop':
      return viewShoppingList(chatId, lang);
    case 'history':
      return viewHistory(chatId, lang);
    case 'history_use': {
      const user = await getLinkedUser(chatId);
      if (!user) return promptLogin(chatId, lang);
      await prisma.mealPlan.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } });
      await prisma.mealPlan.updateMany({ where: { id: a, userId: user.id }, data: { isActive: true } });
      await sendMessage(chatId, L(lang, '✅ План активирован.', '✅ Plan activated.'));
      return viewPlanDay(chatId, lang, 0);
    }
    case 'profile':
      return viewProfile(chatId, lang);
    case 'sub':
      return viewSubscription(chatId, lang);
    case 'sub_buy': {
      const user = await getLinkedUser(chatId);
      if (!user) return promptLogin(chatId, lang);
      const planKey = a === 'yearly' ? 'yearly' : 'monthly';
      const url = await createCheckoutLink(user.id, planKey);
      if (!url) return sendMessage(chatId, L(lang, 'Оплата временно недоступна.', 'Payment is temporarily unavailable.'), { reply_markup: backToMenuKb(lang) });
      return sendMessage(chatId, L(lang, '🎁 7 дней бесплатно, затем автосписание. Нажмите кнопку ниже — потребуется привязать карту, но списания в течение пробного периода не будет. Отменить можно в любой момент.', '🎁 7 days free, then auto-renews. Tap the button below — a card is required, but you will not be charged during the trial. Cancel anytime.'), {
        reply_markup: inlineKeyboard([[{ text: L(lang, '💳 Перейти к оплате', '💳 Go to checkout'), url }], [{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]]),
      });
    }
    case 'sub_manage': {
      const user = await getLinkedUser(chatId);
      if (!user) return promptLogin(chatId, lang);
      const url = await createPortalLink(user.id);
      if (!url) return sendMessage(chatId, L(lang, 'Управление подпиской недоступно.', 'Subscription management is unavailable.'), { reply_markup: backToMenuKb(lang) });
      return sendMessage(chatId, L(lang, '⚙️ Управление подпиской:', '⚙️ Manage your subscription:'), {
        reply_markup: inlineKeyboard([[{ text: L(lang, '⚙️ Открыть', '⚙️ Open'), url }], [{ text: L(lang, '⬅️ В меню', '⬅️ Menu'), callback_data: 'menu' }]]),
      });
    }
    case 'support':
      return viewSupport(chatId, lang);
    case 'support_new': {
      const user = await getLinkedUser(chatId);
      if (!user) return promptLogin(chatId, lang);
      await setStepAndDraft(chatId, 'support_subject', {});
      return sendMessage(chatId, L(lang, 'Введите тему обращения:', 'Enter the subject of your request:'));
    }
    case 'support_view':
      return viewTicket(chatId, lang, a);
    case 'support_reply': {
      const user = await getLinkedUser(chatId);
      if (!user) return promptLogin(chatId, lang);
      await setStepAndDraft(chatId, 'support_reply', { ticketId: a });
      return sendMessage(chatId, L(lang, 'Введите ваш ответ:', 'Enter your reply:'));
    }
  }
}

async function advanceOnboarding(chatId: string, lang: BotLang, idx: number, draft: Record<string, any>) {
  const next = idx + 1;
  if (next >= ONBOARDING.length) {
    const user = await getLinkedUser(chatId);
    if (!user) return promptLogin(chatId, lang);
    return finishOnboarding(chatId, user.id, lang, draft);
  }
  await setStepAndDraft(chatId, `ob:${next}`, draft);
  return askOnboarding(chatId, lang, next, draft);
}

// ------------------------------------------------------------------
// Message (text) handling
// ------------------------------------------------------------------

async function handleMessage(msg: any) {
  const chatId = String(msg.chat?.id ?? msg.from?.id ?? '');
  if (!chatId) return;
  const text: string = (msg.text ?? '').trim();

  // /chatid — works in ANY chat (including groups). Used to set up the system
  // notification group. Handled before ensureChat so group chats don't create
  // per-user chat records.
  const firstTok = text.split(/\s+/)[0].toLowerCase().replace(/@.*$/, '');
  if (firstTok === '/chatid' || firstTok === '/id') {
    const type = msg.chat?.type || 'private';
    await sendMessage(chatId, `Chat ID: <code>${chatId}</code>\nType: ${type}`);
    return;
  }

  const chat = await ensureChat(chatId, msg.from?.language_code);
  const lang = chat.lang;

  // Commands
  if (text.startsWith('/')) {
    const cmd = text.split(/\s+/)[0].toLowerCase().replace(/@.*$/, '');
    if (cmd === '/start') {
      const user = await getLinkedUser(chatId);
      if (user) return showMainMenu(chatId, lang, user.name);
      return showWelcome(chatId, lang);
    }
    if (cmd === '/menu') {
      const user = await getLinkedUser(chatId);
      if (!user) return showWelcome(chatId, lang);
      return showMainMenu(chatId, lang, user.name);
    }
    if (cmd === '/cancel') {
      await resetFlow(chatId);
      const user = await getLinkedUser(chatId);
      if (!user) return showWelcome(chatId, lang);
      return showMainMenu(chatId, lang, user.name);
    }
    if (cmd === '/help') {
      return sendMessage(chatId, L(lang, 'Команды:\n/start — начало\n/menu — главное меню\n/cancel — отмена текущего действия', 'Commands:\n/start — start\n/menu — main menu\n/cancel — cancel current action'));
    }
  }

  const step = chat.step ?? '';

  // --- Auth flows ---
  if (step === 'login_email') {
    if (!/^\S+@\S+\.\S+$/.test(text)) return sendMessage(chatId, L(lang, 'Введите корректный email:', 'Enter a valid email:'));
    await setStepAndDraft(chatId, 'login_password', { email: text.toLowerCase() });
    return sendMessage(chatId, L(lang, 'Введите пароль:', 'Enter your password:'));
  }
  if (step === 'login_password') {
    const email = (chat.draft.email ?? '').toString();
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    const ok = user ? await bcrypt.compare(text, user.passwordHash) : false;
    if (!ok || !user) {
      await resetFlow(chatId);
      return sendMessage(chatId, L(lang, '❌ Неверный email или пароль. Попробуйте снова.', '❌ Wrong email or password. Try again.'), {
        reply_markup: inlineKeyboard([[{ text: L(lang, '🔑 Войти', '🔑 Log in'), callback_data: 'login' }]]),
      });
    }
    await linkUser(chatId, user.id);
    await sendMessage(chatId, L(lang, '✅ Вы вошли в аккаунт!', '✅ You are logged in!'));
    if (!user.profile?.onboardingDone) return startOnboarding(chatId, lang);
    return showMainMenu(chatId, lang, user.name);
  }
  if (step === 'reg_email') {
    if (!/^\S+@\S+\.\S+$/.test(text)) return sendMessage(chatId, L(lang, 'Введите корректный email:', 'Enter a valid email:'));
    const existing = await prisma.user.findUnique({ where: { email: text.toLowerCase() } });
    if (existing) {
      return sendMessage(chatId, L(lang, 'Такой email уже зарегистрирован. Войдите в аккаунт.', 'This email is already registered. Please log in.'), {
        reply_markup: inlineKeyboard([[{ text: L(lang, '🔑 Войти', '🔑 Log in'), callback_data: 'login' }]]),
      });
    }
    await setStepAndDraft(chatId, 'reg_password', { email: text.toLowerCase() });
    return sendMessage(chatId, L(lang, 'Придумайте пароль (мин. 6 символов):', 'Create a password (min. 6 chars):'));
  }
  if (step === 'reg_password') {
    if (text.length < 6) return sendMessage(chatId, L(lang, 'Пароль слишком короткий. Минимум 6 символов:', 'Password too short. Min 6 chars:'));
    await setStepAndDraft(chatId, 'reg_name', { ...chat.draft, password: text });
    return sendMessage(chatId, L(lang, 'Как вас зовут?', 'What is your name?'));
  }
  if (step === 'reg_name') {
    const email = (chat.draft.email ?? '').toString();
    const password = (chat.draft.password ?? '').toString();
    if (!email || !password) {
      await resetFlow(chatId);
      return showWelcome(chatId, lang);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: text.slice(0, 80), passwordHash, profile: { create: { onboardingDone: false } } },
    });
    await linkUser(chatId, user.id);
    await sendMessage(chatId, L(lang, '✅ Аккаунт создан!', '✅ Account created!'));
    return startOnboarding(chatId, lang);
  }

  // --- Onboarding number inputs ---
  if (step.startsWith('ob:')) {
    const idx = parseInt(step.slice(3), 10);
    const obStep = ONBOARDING[idx];
    if (obStep && obStep.type === 'number') {
      const val = parseFloat(text.replace(',', '.'));
      if (isNaN(val) || val <= 0) return sendMessage(chatId, L(lang, 'Введите положительное число:', 'Enter a positive number:'));
      const draft = { ...chat.draft };
      draft[obStep.key] = obStep.key === 'age' ? Math.round(val) : val;
      return advanceOnboarding(chatId, lang, idx, draft);
    }
    // If we're on a choice/multi step, nudge the user to use buttons.
    return sendMessage(chatId, L(lang, 'Пожалуйста, выберите вариант кнопкой выше.', 'Please pick an option using the buttons above.'));
  }

  // --- Pantry add ---
  if (step === 'pantry_add') {
    const user = await getLinkedUser(chatId);
    if (!user) return promptLogin(chatId, lang);
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      return sendMessage(chatId, L(lang, 'Формат: название количество единица. Например: Молоко 1 л', 'Format: name quantity unit. Example: Milk 1 l'));
    }
    const unit = parts[parts.length - 1];
    const qty = parseFloat(parts[parts.length - 2].replace(',', '.'));
    const name = parts.slice(0, parts.length - 2).join(' ');
    if (!name || isNaN(qty) || qty <= 0) {
      return sendMessage(chatId, L(lang, 'Не получилось распознать. Пример: Куриное филе 500 г', 'Could not parse. Example: Chicken breast 500 g'));
    }
    await prisma.pantryItem.create({ data: { userId: user.id, name: name.slice(0, 80), quantity: qty, unit: unit.slice(0, 20) } });
    await resetFlow(chatId);
    await sendMessage(chatId, L(lang, '✅ Добавлено в кладовую.', '✅ Added to pantry.'));
    return viewPantry(chatId, lang);
  }

  // --- Support flows ---
  if (step === 'support_subject') {
    if (!text) return sendMessage(chatId, L(lang, 'Введите тему:', 'Enter a subject:'));
    await setStepAndDraft(chatId, 'support_message', { subject: text.slice(0, 200) });
    return sendMessage(chatId, L(lang, 'Теперь опишите ваш вопрос:', 'Now describe your question:'));
  }
  if (step === 'support_message') {
    const user = await getLinkedUser(chatId);
    if (!user) return promptLogin(chatId, lang);
    if (!text) return sendMessage(chatId, L(lang, 'Введите текст обращения:', 'Enter your message:'));
    const subject = (chat.draft.subject ?? '').toString() || L(lang, 'Обращение', 'Request');
    await prisma.supportTicket.create({
      data: { userId: user.id, subject: subject.slice(0, 200), status: 'open', messages: { create: { isAdmin: false, body: text.slice(0, 5000) } } },
    });
    await resetFlow(chatId);
    await emailAdminNewTicket(subject, text, user.name, user.email);
    await notifyAdminNewTicket(subject, text, user.name, user.email, 'telegram');
    await sendMessage(chatId, L(lang, '✅ Обращение отправлено! Ответ придёт сюда, в Telegram.', '✅ Request sent! The reply will arrive here in Telegram.'), { reply_markup: backToMenuKb(lang) });
    return;
  }
  if (step === 'support_reply') {
    const user = await getLinkedUser(chatId);
    if (!user) return promptLogin(chatId, lang);
    const ticketId = (chat.draft.ticketId ?? '').toString();
    const ticket = ticketId ? await prisma.supportTicket.findFirst({ where: { id: ticketId, userId: user.id } }) : null;
    if (!ticket) {
      await resetFlow(chatId);
      return sendMessage(chatId, L(lang, 'Обращение не найдено.', 'Request not found.'), { reply_markup: backToMenuKb(lang) });
    }
    await prisma.supportMessage.create({ data: { ticketId: ticket.id, isAdmin: false, body: text.slice(0, 5000) } });
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { status: 'open' } });
    await resetFlow(chatId);
    await sendMessage(chatId, L(lang, '✅ Ответ отправлен.', '✅ Reply sent.'));
    return viewTicket(chatId, lang, ticket.id);
  }

  // No active flow: guide the user.
  const user = await getLinkedUser(chatId);
  if (!user) return showWelcome(chatId, lang);
  return showMainMenu(chatId, lang, user.name);
}

// ------------------------------------------------------------------
// Entry point
// ------------------------------------------------------------------

export async function handleUpdate(update: any): Promise<void> {
  try {
    if (update?.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update?.message) {
      await handleMessage(update.message);
    }
  } catch (e: any) {
    console.error('handleUpdate error:', e?.message, e?.stack);
  }
}