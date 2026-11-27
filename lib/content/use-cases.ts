// Bilingual use-case landing pages for content SEO. Each page targets a
// specific diet/goal query and shares the same slug across languages.

import { getProgrammaticPlan, PROGRAMMATIC_SLUGS } from './programmatic';

export type UseCaseFaq = { q: string; a: string };

export type UseCase = {
  slug: string;
  emoji: string;
  title: string;
  subtitle: string;
  intro: string;
  benefitsTitle: string;
  benefits: { title: string; text: string }[];
  howTitle: string;
  how: string[];
  sampleTitle: string;
  sample: { meal: string; dish: string }[];
  faqTitle: string;
  faqs: UseCaseFaq[];
  ctaTitle: string;
  ctaText: string;
};

export const USE_CASE_INDEX_META = {
  en: {
    title: 'AI meal plans for every goal',
    subtitle:
      'Pick your diet or goal and let Eatwise build a personalized weekly plan — recipes, macros and a shopping list included.',
    cardCta: 'Explore plan',
    moreTitle: 'More meal plans by calories, diet & goal',
    moreSubtitle: 'Explore even more personalized plans — by calorie target, diet type and lifestyle goal.',
  },
  ru: {
    title: 'Планы питания ИИ для любой цели',
    subtitle:
      'Выберите диету или цель, а Eatwise соберёт персональный план на неделю — с рецептами, КБЖУ и списком покупок.',
    cardCta: 'Подробнее',
    moreTitle: 'Ещё планы питания — по калориям, диете и цели',
    moreSubtitle: 'Больше персональных планов — по норме калорий, типу диеты и цели образа жизни.',
  },
} as const;

export const SHARED_LABELS = {
  en: {
    backToPlans: 'All meal plans',
    sampleMeals: { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' },
    ctaButton: 'Build my plan free',
  },
  ru: {
    backToPlans: 'Все планы питания',
    sampleMeals: { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус' },
    ctaButton: 'Собрать план бесплатно',
  },
} as const;

export const USE_CASES: Record<'en' | 'ru', UseCase[]> = {
  en: [
    {
      slug: 'keto',
      emoji: '🥑',
      title: 'Keto meal plan generator',
      subtitle: 'Low-carb, high-fat weekly plans that keep you in ketosis — without the guesswork.',
      intro:
        'A ketogenic diet keeps carbs very low so your body burns fat for fuel. The hard part is staying under your carb limit while still eating satisfying, varied meals. Eatwise handles the math and the menu for you.',
      benefitsTitle: 'Why a keto plan with Eatwise',
      benefits: [
        { title: 'Carb limit respected', text: 'Every day is built to stay within your keto carb target automatically.' },
        { title: 'High satiety', text: 'Plenty of protein and healthy fats keep you full between meals.' },
        { title: 'No repetition fatigue', text: 'Rotating recipes so keto never feels boring or restrictive.' },
      ],
      howTitle: 'How it works',
      how: [
        'Tell us your calorie target, tastes and any allergies.',
        'Eatwise generates a weekly keto plan with macros for each meal.',
        'Get a consolidated shopping list and cook with confidence.',
      ],
      sampleTitle: 'A sample keto day',
      sample: [
        { meal: 'breakfast', dish: 'Spinach & feta omelette with avocado' },
        { meal: 'lunch', dish: 'Grilled chicken Caesar salad, no croutons' },
        { meal: 'dinner', dish: 'Baked salmon with buttered green beans' },
        { meal: 'snack', dish: 'Greek yogurt with walnuts' },
      ],
      faqTitle: 'Keto plan questions',
      faqs: [
        { q: 'How many carbs will the plan allow?', a: 'Plans are built around a low daily carb range typical of keto, adjusted to your calorie target. You can regenerate if you want it stricter or looser.' },
        { q: 'Can it handle allergies?', a: 'Yes — tell Eatwise what to avoid and it will exclude those ingredients from every meal.' },
      ],
      ctaTitle: 'Start your keto week',
      ctaText: 'Get a personalized keto meal plan with recipes and a shopping list in seconds.',
    },
    {
      slug: 'vegetarian',
      emoji: '🥗',
      title: 'Vegetarian meal plan generator',
      subtitle: 'Balanced, protein-rich vegetarian plans that are anything but boring.',
      intro:
        'Eating vegetarian is easy; eating vegetarian with enough protein and variety takes planning. Eatwise builds weekly vegetarian menus that stay balanced and interesting.',
      benefitsTitle: 'Why a vegetarian plan with Eatwise',
      benefits: [
        { title: 'Protein covered', text: 'Every meal includes a solid plant or dairy protein source so you hit your target.' },
        { title: 'Truly varied', text: 'Global recipes keep your week exciting instead of the same pasta twice.' },
        { title: 'Balanced nutrition', text: 'Plans consider fiber, iron-rich foods and healthy fats, not just calories.' },
      ],
      howTitle: 'How it works',
      how: [
        'Set your calorie goal, preferences and any allergies.',
        'Eatwise builds a weekly vegetarian plan with balanced macros.',
        'Receive a categorized shopping list and start cooking.',
      ],
      sampleTitle: 'A sample vegetarian day',
      sample: [
        { meal: 'breakfast', dish: 'Greek yogurt bowl with berries and oats' },
        { meal: 'lunch', dish: 'Chickpea and quinoa power salad' },
        { meal: 'dinner', dish: 'Paneer and vegetable curry with brown rice' },
        { meal: 'snack', dish: 'Hummus with veggie sticks' },
      ],
      faqTitle: 'Vegetarian plan questions',
      faqs: [
        { q: 'Will I get enough protein?', a: 'Yes — plans intentionally anchor each meal around a plant or dairy protein so you comfortably meet your goal.' },
        { q: 'Can it be made vegan?', a: 'Tell Eatwise to avoid dairy and eggs and it will build a fully plant-based plan instead.' },
      ],
      ctaTitle: 'Start your vegetarian week',
      ctaText: 'Get a balanced vegetarian meal plan with recipes and a shopping list in seconds.',
    },
    {
      slug: 'weight-loss',
      emoji: '🎯',
      title: 'Weight-loss meal plan generator',
      subtitle: 'A gentle calorie deficit, filling meals and zero crash-diet misery.',
      intro:
        'Sustainable weight loss comes from a moderate calorie deficit you can actually stick to. Eatwise plans meals that keep you full and on target — no starvation, no bland food.',
      benefitsTitle: 'Why a weight-loss plan with Eatwise',
      benefits: [
        { title: 'Right calorie target', text: 'Plans are sized to a sustainable deficit based on your details.' },
        { title: 'High-satiety meals', text: 'Protein and vegetables keep hunger away so the deficit feels easy.' },
        { title: 'Habit-friendly', text: 'Realistic, repeatable meals you can keep up for months, not days.' },
      ],
      howTitle: 'How it works',
      how: [
        'Share your goal, current habits and any foods to avoid.',
        'Eatwise calculates a sensible calorie target and builds your week.',
        'Cook from the plan and shop from the auto-generated list.',
      ],
      sampleTitle: 'A sample weight-loss day',
      sample: [
        { meal: 'breakfast', dish: 'Veggie egg scramble with whole-grain toast' },
        { meal: 'lunch', dish: 'Grilled chicken bowl with greens and quinoa' },
        { meal: 'dinner', dish: 'Baked white fish with roasted vegetables' },
        { meal: 'snack', dish: 'Apple with a handful of almonds' },
      ],
      faqTitle: 'Weight-loss plan questions',
      faqs: [
        { q: 'How fast will I lose weight?', a: 'Eatwise targets a moderate, sustainable deficit. Steady progress you can maintain beats rapid loss you rebound from.' },
        { q: 'Will I be hungry?', a: 'Plans prioritize high-protein, high-volume meals specifically so you feel satisfied on fewer calories.' },
      ],
      ctaTitle: 'Start losing weight the sane way',
      ctaText: 'Get a filling, calorie-smart meal plan with recipes and a shopping list in seconds.',
    },
    {
      slug: 'high-protein',
      emoji: '💪',
      title: 'High-protein meal plan generator',
      subtitle: 'Hit your protein target every day to build muscle and stay full.',
      intro:
        'Whether you are building muscle or just staying satisfied, protein is the macro that matters most. Eatwise builds weekly plans that reliably hit your protein goal across every meal.',
      benefitsTitle: 'Why a high-protein plan with Eatwise',
      benefits: [
        { title: 'Protein target met', text: 'Every meal is designed to add up to your daily protein goal.' },
        { title: 'Muscle-friendly', text: 'Adequate protein supports recovery and lean-muscle growth alongside training.' },
        { title: 'Still balanced', text: 'Plenty of carbs and healthy fats too — protein-focused, not protein-only.' },
      ],
      howTitle: 'How it works',
      how: [
        'Enter your protein and calorie targets plus preferences.',
        'Eatwise builds a weekly plan with a protein source in every meal.',
        'Grab your shopping list and fuel your training.',
      ],
      sampleTitle: 'A sample high-protein day',
      sample: [
        { meal: 'breakfast', dish: 'Protein oats with Greek yogurt and berries' },
        { meal: 'lunch', dish: 'Turkey and rice bowl with black beans' },
        { meal: 'dinner', dish: 'Grilled steak with potatoes and broccoli' },
        { meal: 'snack', dish: 'Cottage cheese with pineapple' },
      ],
      faqTitle: 'High-protein plan questions',
      faqs: [
        { q: 'How much protein will the plan target?', a: 'Eatwise aims for a high daily protein intake suited to active adults, adjustable to your exact goal.' },
        { q: 'Does it work for vegetarians?', a: 'Yes — tell Eatwise your preferences and it will hit your protein goal with plant and dairy sources.' },
      ],
      ctaTitle: 'Start hitting your protein goal',
      ctaText: 'Get a high-protein meal plan with recipes and a shopping list in seconds.',
    },
  ],
  ru: [
    {
      slug: 'keto',
      emoji: '🥑',
      title: 'Генератор кето-планов питания',
      subtitle: 'Низкоуглеводные планы с высоким содержанием жиров — без лишних расчётов.',
      intro:
        'Кето-диета держит углеводы очень низкими, чтобы тело сжигало жир. Сложность — оставаться в лимите углеводов и при этом есть вкусно и разнообразно. Eatwise берёт расчёты и меню на себя.',
      benefitsTitle: 'Почему кето-план с Eatwise',
      benefits: [
        { title: 'Лимит углеводов соблюдён', text: 'Каждый день автоматически укладывается в вашу кето-норму углеводов.' },
        { title: 'Высокая сытость', text: 'Достаток белка и полезных жиров держит сытость между приёмами пищи.' },
        { title: 'Без однообразия', text: 'Ротация рецептов, чтобы кето не казалось скучным.' },
      ],
      howTitle: 'Как это работает',
      how: [
        'Укажите норму калорий, вкусы и аллергии.',
        'Eatwise создаёт кето-план на неделю с КБЖУ к каждому блюду.',
        'Получите сводный список покупок и готовьте спокойно.',
      ],
      sampleTitle: 'Пример кето-дня',
      sample: [
        { meal: 'breakfast', dish: 'Омлет со шпинатом и фетой, авокадо' },
        { meal: 'lunch', dish: 'Салат «Цезарь» с курицей без сухариков' },
        { meal: 'dinner', dish: 'Запечённый лосось со стручковой фасолью' },
        { meal: 'snack', dish: 'Греческий йогурт с грецкими орехами' },
      ],
      faqTitle: 'Вопросы о кето-плане',
      faqs: [
        { q: 'Сколько углеводов допускает план?', a: 'Планы строятся вокруг низкого дневного диапазона углеводов, типичного для кето. Можно перегенерировать строже или мягче.' },
        { q: 'Учитываются ли аллергии?', a: 'Да — укажите, что исключить, и Eatwise уберёт эти ингредиенты из каждого блюда.' },
      ],
      ctaTitle: 'Начните кето-неделю',
      ctaText: 'Получите персональный кето-план с рецептами и списком покупок за секунды.',
    },
    {
      slug: 'vegetarian',
      emoji: '🥗',
      title: 'Генератор вегетарианских планов питания',
      subtitle: 'Сбалансированные вегетарианские планы с достатком белка — и без скуки.',
      intro:
        'Быть вегетарианцем легко; сложнее — получать достаточно белка и разнообразия. Eatwise собирает вегетарианское меню на неделю, которое остаётся сбалансированным и интересным.',
      benefitsTitle: 'Почему вегетарианский план с Eatwise',
      benefits: [
        { title: 'Белок покрыт', text: 'В каждом блюде есть растительный или молочный источник белка.' },
        { title: 'Действительно разнообразно', text: 'Рецепты со всего мира делают неделю разнообразной.' },
        { title: 'Сбалансированно', text: 'Планы учитывают клетчатку, железо и полезные жиры, а не только калории.' },
      ],
      howTitle: 'Как это работает',
      how: [
        'Задайте норму калорий, предпочтения и аллергии.',
        'Eatwise строит вегетарианский план на неделю с балансом КБЖУ.',
        'Получите список покупок по категориям и начните готовить.',
      ],
      sampleTitle: 'Пример вегетарианского дня',
      sample: [
        { meal: 'breakfast', dish: 'Греческий йогурт с ягодами и овсянкой' },
        { meal: 'lunch', dish: 'Салат из нута и киноа' },
        { meal: 'dinner', dish: 'Карри с паниром и овощами, бурый рис' },
        { meal: 'snack', dish: 'Хумус с овощными палочками' },
      ],
      faqTitle: 'Вопросы о вегетарианском плане',
      faqs: [
        { q: 'Хватит ли белка?', a: 'Да — планы намеренно строятся вокруг растительного или молочного белка, чтобы вы спокойно достигали цели.' },
        { q: 'Можно ли сделать веганским?', a: 'Укажите Eatwise исключить молочное и яйца — и план станет полностью растительным.' },
      ],
      ctaTitle: 'Начните вегетарианскую неделю',
      ctaText: 'Получите сбалансированный вегетарианский план с рецептами и списком покупок за секунды.',
    },
    {
      slug: 'weight-loss',
      emoji: '🎯',
      title: 'Генератор планов питания для похудения',
      subtitle: 'Мягкий дефицит калорий, сытные блюда и никаких жёстких диет.',
      intro:
        'Устойчивое похудение — это умеренный дефицит калорий, которого реально придерживаться. Eatwise планирует блюда, которые держат сытость и цель — без голода и пресной еды.',
      benefitsTitle: 'Почему план для похудения с Eatwise',
      benefits: [
        { title: 'Верная норма калорий', text: 'Планы рассчитаны на устойчивый дефицит по вашим данным.' },
        { title: 'Сытные блюда', text: 'Белок и овощи убирают голод, так что дефицит переносится легко.' },
        { title: 'Удобно для привычек', text: 'Реалистичные блюда, которые можно держать месяцами.' },
      ],
      howTitle: 'Как это работает',
      how: [
        'Расскажите о цели, привычках и продуктах, которых избегаете.',
        'Eatwise рассчитает разумную норму калорий и соберёт неделю.',
        'Готовьте по плану и покупайте по автосписку.',
      ],
      sampleTitle: 'Пример дня для похудения',
      sample: [
        { meal: 'breakfast', dish: 'Скрембл с овощами и цельнозерновым тостом' },
        { meal: 'lunch', dish: 'Боул с курицей, зеленью и киноа' },
        { meal: 'dinner', dish: 'Запечённая белая рыба с овощами' },
        { meal: 'snack', dish: 'Яблоко и горсть миндаля' },
      ],
      faqTitle: 'Вопросы о плане для похудения',
      faqs: [
        { q: 'Как быстро будет результат?', a: 'Eatwise целится в умеренный устойчивый дефицит. Стабильный прогресс лучше быстрого сброса с откатом.' },
        { q: 'Буду ли я голодать?', a: 'Планы специально делают акцент на белке и объёмных блюдах, чтобы вы были сыты на меньшем количестве калорий.' },
      ],
      ctaTitle: 'Начните худеть разумно',
      ctaText: 'Получите сытный план с учётом калорий, рецептами и списком покупок за секунды.',
    },
    {
      slug: 'high-protein',
      emoji: '💪',
      title: 'Генератор высокобелковых планов питания',
      subtitle: 'Достигайте нормы белка каждый день — для мышц и сытости.',
      intro:
        'Строите ли вы мышцы или просто хотите быть сытыми — белок самый важный макрос. Eatwise собирает планы, которые надёжно попадают в вашу норму белка.',
      benefitsTitle: 'Почему высокобелковый план с Eatwise',
      benefits: [
        { title: 'Норма белка достигнута', text: 'Каждое блюдо в сумме даёт вашу дневную норму белка.' },
        { title: 'Для мышц', text: 'Достаток белка поддерживает восстановление и рост мышц.' },
        { title: 'Всё равно сбалансировано', text: 'Достаток углеводов и жиров — акцент на белке, а не только белок.' },
      ],
      howTitle: 'Как это работает',
      how: [
        'Введите нормы белка и калорий и предпочтения.',
        'Eatwise строит план с источником белка в каждом приёме пищи.',
        'Берите список покупок и заряжайте тренировки.',
      ],
      sampleTitle: 'Пример высокобелкового дня',
      sample: [
        { meal: 'breakfast', dish: 'Протеиновая овсянка с йогуртом и ягодами' },
        { meal: 'lunch', dish: 'Боул с индейкой, рисом и чёрной фасолью' },
        { meal: 'dinner', dish: 'Стейк с картофелем и брокколи' },
        { meal: 'snack', dish: 'Творог с ананасом' },
      ],
      faqTitle: 'Вопросы о высокобелковом плане',
      faqs: [
        { q: 'На какую норму белка целится план?', a: 'Eatwise ориентируется на высокое дневное потребление белка для активных взрослых, под вашу цель.' },
        { q: 'Подойдёт ли вегетарианцам?', a: 'Да — укажите предпочтения, и Eatwise достигнет нормы белка растительными и молочными источниками.' },
      ],
      ctaTitle: 'Начните добирать белок',
      ctaText: 'Получите высокобелковый план с рецептами и списком покупок за секунды.',
    },
  ],
};

export const USE_CASE_SLUGS = USE_CASES.en.map((u) => u.slug);

export const ALL_PLAN_SLUGS = [...USE_CASE_SLUGS, ...PROGRAMMATIC_SLUGS];

export function getUseCase(lang: 'en' | 'ru', slug: string): UseCase | undefined {
  return USE_CASES[lang].find((u) => u.slug === slug) || getProgrammaticPlan(lang, slug);
}
