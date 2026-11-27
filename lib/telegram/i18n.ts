// Compact bot-local i18n. Uses inline (ru, en) pairs to keep strings near usage.

export type BotLang = 'ru' | 'en';

export function L(lang: BotLang, ru: string, en: string): string {
  return lang === 'en' ? en : ru;
}

// Localized labels for profile option values (shared with meal-plan prompt keys).
export const GOAL_LABELS: Record<string, { ru: string; en: string }> = {
  lose: { ru: 'Похудение', en: 'Weight loss' },
  maintain: { ru: 'Поддержание веса', en: 'Maintain weight' },
  gain: { ru: 'Набор массы', en: 'Muscle gain' },
};

export const DIET_LABELS: Record<string, { ru: string; en: string }> = {
  regular: { ru: 'Обычное', en: 'Regular' },
  vegetarian: { ru: 'Вегетарианское', en: 'Vegetarian' },
  vegan: { ru: 'Веганское', en: 'Vegan' },
  gluten_free: { ru: 'Без глютена', en: 'Gluten-free' },
  keto: { ru: 'Кето', en: 'Keto' },
};

export const ACTIVITY_LABELS: Record<string, { ru: string; en: string }> = {
  low: { ru: 'Низкая', en: 'Low' },
  moderate: { ru: 'Умеренная', en: 'Moderate' },
  high: { ru: 'Высокая', en: 'High' },
};

export const GENDER_LABELS: Record<string, { ru: string; en: string }> = {
  male: { ru: 'Мужской', en: 'Male' },
  female: { ru: 'Женский', en: 'Female' },
};

export const ALLERGY_LABELS: Record<string, { ru: string; en: string }> = {
  Nuts: { ru: 'Орехи', en: 'Nuts' },
  Dairy: { ru: 'Молочное', en: 'Dairy' },
  Eggs: { ru: 'Яйца', en: 'Eggs' },
  Seafood: { ru: 'Морепродукты', en: 'Seafood' },
  Gluten: { ru: 'Глютен', en: 'Gluten' },
  Citrus: { ru: 'Цитрусовые', en: 'Citrus' },
  Other: { ru: 'Прочее', en: 'Other' },
};

export const CURRENCY_LABELS: Record<string, { ru: string; en: string }> = {
  RUB: { ru: 'Рубль (₽)', en: 'Ruble (₽)' },
  USD: { ru: 'Доллар ($)', en: 'Dollar ($)' },
  EUR: { ru: 'Евро (€)', en: 'Euro (€)' },
  GBP: { ru: 'Фунт (£)', en: 'Pound (£)' },
};

export const MEAL_TYPE_LABELS: Record<string, { ru: string; en: string }> = {
  breakfast: { ru: '🌾 Завтрак', en: '🌾 Breakfast' },
  lunch: { ru: '🍲 Обед', en: '🍲 Lunch' },
  dinner: { ru: '🍽 Ужин', en: '🍽 Dinner' },
  snack: { ru: '🍎 Перекус', en: '🍎 Snack' },
};

export function optLabel(
  map: Record<string, { ru: string; en: string }>,
  key: string,
  lang: BotLang
): string {
  return map[key]?.[lang] ?? key;
}
