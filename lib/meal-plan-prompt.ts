// Shared 7-day meal-plan prompt builder. Used by both the web streaming route
// (app/api/meal-plan/generate) and the Telegram bot so the generation logic
// stays identical across surfaces.

type AnyProfile = {
  age?: number | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  activityLevel?: string | null;
  goal?: string | null;
  dietaryPreference?: string | null;
  allergies?: any;
  budget?: number | null;
  currency?: string | null;
  unitSystem?: string | null;
  cookingTime?: string | null;
} | null | undefined;

type AnyPantryItem = { name?: string | null; quantity?: number | null; unit?: string | null };

export function buildMealPlanPrompt(
  profile: AnyProfile,
  pantryItems: AnyPantryItem[] | null | undefined,
  lang: 'en' | 'ru'
): string {
  const allergyMap: Record<string, { en: string; ru: string }> = {
    Nuts: { en: 'nuts', ru: 'орехи' },
    Dairy: { en: 'dairy', ru: 'молочные продукты' },
    Eggs: { en: 'eggs', ru: 'яйца' },
    Seafood: { en: 'seafood', ru: 'морепродукты' },
    Gluten: { en: 'gluten', ru: 'глютен' },
    Citrus: { en: 'citrus', ru: 'цитрусовые' },
    Other: { en: 'other allergens', ru: 'прочие аллергены' },
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

  if (lang === 'en') {
    const pantryList = (pantryItems ?? []).map((i: any) => `${i?.name ?? ''} (${i?.quantity ?? 0} ${i?.unit ?? ''})`).join(', ') || 'No items';
    const goalMap: Record<string, string> = { lose: 'weight loss', gain: 'muscle gain', maintain: 'maintain weight' };
    const dietMap: Record<string, string> = { regular: 'regular', vegetarian: 'vegetarian', vegan: 'vegan', gluten_free: 'gluten-free', keto: 'keto' };
    return `You are a professional nutritionist. Build a 7-day meal plan.

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
- Preferred cooking time per meal: ${profile?.cookingTime ?? '30-45'} minutes

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
  }

  const pantryList = (pantryItems ?? []).map((i: any) => `${i?.name ?? ''} (${i?.quantity ?? 0} ${i?.unit ?? ''})`).join(', ') || 'Нет продуктов';
  const goalMap: Record<string, string> = { lose: 'похудение', gain: 'набор массы', maintain: 'поддержание веса' };
  const dietMap: Record<string, string> = { regular: 'обычное', vegetarian: 'вегетарианство', vegan: 'веганство', gluten_free: 'безглютеновое', keto: 'кето' };
  return `Ты — профессиональный диетолог. Составь план питания на 7 дней.

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
- Желаемое время на готовку одного блюда: ${profile?.cookingTime ?? '30-45'} минут

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
