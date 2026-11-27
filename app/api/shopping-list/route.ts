export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface Ingredient {
  name: string;
  amount: string;
}

interface Meal {
  type: string;
  name: string;
  ingredients: Ingredient[];
}

interface Day {
  day: string;
  meals: Meal[];
}

const categorizeIngredient = (name: string): string => {
  const lower = (name ?? '').toLowerCase();
  const vegs = ['огур', 'помидор', 'морков', 'лук', 'капуст', 'перец', 'картофел', 'свекл', 'чеснок', 'укроп', 'петрушк', 'салат', 'кабач', 'баклажан', 'тыкв', 'яблок', 'банан', 'апельсин', 'лимон', 'ягод', 'клубник', 'гриб', 'сельдерей', 'шпинат', 'авокадо', 'брокколи', 'цветная капуст', 'cucumber', 'tomato', 'carrot', 'onion', 'cabbage', 'pepper', 'potato', 'beet', 'garlic', 'dill', 'parsley', 'lettuce', 'zucchini', 'eggplant', 'pumpkin', 'apple', 'banana', 'orange', 'lemon', 'berry', 'berries', 'strawberr', 'mushroom', 'celery', 'spinach', 'avocado', 'broccoli', 'cauliflower', 'vegetable', 'fruit', 'lime', 'grape', 'pear', 'cherry', 'peach', 'kale', 'corn', 'pea', 'bean sprout'];
  const meats = ['куриц', 'курин', 'говяд', 'свин', 'индейк', 'рыб', 'лосос', 'семг', 'филе', 'кревет', 'тунец', 'фарш', 'мяс', 'колбас', 'ветчин', 'chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'fillet', 'shrimp', 'prawn', 'tuna', 'mince', 'ground meat', 'meat', 'sausage', 'ham', 'bacon', 'cod', 'trout', 'seafood'];
  const dairy = ['молок', 'сыр', 'творог', 'кефир', 'йогурт', 'сметан', 'сливк', 'сливочн', 'масло слив', 'яйц', 'milk', 'cheese', 'cottage', 'curd', 'kefir', 'yogurt', 'yoghurt', 'sour cream', 'cream', 'butter', 'egg'];
  const bakery = ['мук', 'хлеб', 'макарон', 'рис', 'греч', 'овсян', 'круп', 'пшен', 'сахар', 'масло раст', 'масло олив', 'масло подсолн', 'булгур', 'кускус', 'нут', 'чечевиц', 'фасол', 'flour', 'bread', 'pasta', 'rice', 'buckwheat', 'oat', 'oatmeal', 'cereal', 'grain', 'millet', 'sugar', 'oil', 'olive oil', 'bulgur', 'couscous', 'chickpea', 'lentil', 'bean', 'quinoa', 'noodle', 'flakes'];
  const spices = ['соль', 'перец черн', 'паприк', 'куркум', 'кориц', 'имбир', 'базилик', 'орегано', 'соус', 'кетчуп', 'майонез', 'горчиц', 'уксус', 'соевый', 'salt', 'black pepper', 'paprika', 'turmeric', 'cinnamon', 'ginger', 'basil', 'oregano', 'sauce', 'ketchup', 'mayo', 'mayonnaise', 'mustard', 'vinegar', 'soy sauce', 'spice', 'cumin', 'thyme', 'rosemary'];

  if (vegs.some((v: string) => lower.includes(v))) return 'vegetables';
  if (meats.some((m: string) => lower.includes(m))) return 'meat';
  if (dairy.some((d: string) => lower.includes(d))) return 'dairy';
  if (bakery.some((b: string) => lower.includes(b))) return 'grocery';
  if (spices.some((s: string) => lower.includes(s))) return 'spices';
  return 'other';
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const activePlan = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!activePlan) {
    return NextResponse.json({ items: [], categories: {} });
  }

  const pantryItems = await prisma.pantryItem.findMany({
    where: { userId: session.user.id },
  });
  const pantryNames = new Set((pantryItems ?? []).map((i: any) => (i?.name ?? '').toLowerCase()));

  // Aggregate ingredients from plan
  const planData = activePlan.planData as any;
  const ingredientMap = new Map<string, string>();

  for (const day of (planData?.days ?? [])) {
    for (const meal of ((day as Day)?.meals ?? [])) {
      for (const ing of ((meal as Meal)?.ingredients ?? [])) {
        const name = (ing as Ingredient)?.name ?? '';
        const key = name.toLowerCase();
        if (!pantryNames.has(key)) {
          if (ingredientMap.has(key)) {
            ingredientMap.set(key, `${ingredientMap.get(key)}, ${(ing as Ingredient)?.amount ?? ''}`);
          } else {
            ingredientMap.set(key, (ing as Ingredient)?.amount ?? '');
          }
        }
      }
    }
  }

  // Group by category
  const categories: Record<string, Array<{ name: string; amount: string; checked: boolean }>> = {};
  for (const [key, amount] of ingredientMap.entries()) {
    const displayName = key.charAt(0).toUpperCase() + key.slice(1);
    const category = categorizeIngredient(key);
    if (!categories[category]) categories[category] = [];
    categories[category].push({ name: displayName, amount, checked: false });
  }

  return NextResponse.json({ categories, planId: activePlan.id });
}
