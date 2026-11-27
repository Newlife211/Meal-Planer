// Programmatic SEO landing pages. Each entry targets a specific high-intent
// search query (e.g. "1500 calorie meal plan", "vegan meal plan",
// "mediterranean diet meal plan"). They reuse the UseCase shape so the existing
// UseCaseView renders them, and they emit the same FAQ + Breadcrumb structured
// data as the hand-written use cases. The unique parts (title, subtitle, intro,
// sample meals, key benefits and FAQs) are authored per plan so pages are not
// thin/duplicate; shared scaffolding (how-it-works steps, section titles, CTA)
// comes from a per-language template.

import type { UseCase } from './use-cases';

type Lang = 'en' | 'ru';
type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type SpecLang = {
  title: string;
  subtitle: string;
  intro: string;
  benefits: { title: string; text: string }[];
  sample: { meal: Meal; dish: string }[];
  faqs: { q: string; a: string }[];
};

type PlanSpec = {
  slug: string;
  emoji: string;
  en: SpecLang;
  ru: SpecLang;
};

// Shared, per-language scaffolding wrapped around each plan's unique content.
const SCAFFOLD: Record<Lang, {
  benefitsTitle: string;
  howTitle: string;
  how: string[];
  sampleTitle: string;
  faqTitle: string;
  ctaTitle: string;
  ctaText: string;
  genericFaqs: (title: string) => { q: string; a: string }[];
}> = {
  en: {
    benefitsTitle: 'Why build this plan with Eatwise',
    howTitle: 'How it works',
    how: [
      'Tell us your calorie target, food preferences and any allergies.',
      'Eatwise generates a full weekly plan with recipes and macros for every meal.',
      'Get a categorized shopping list and start cooking with zero guesswork.',
    ],
    sampleTitle: 'A sample day',
    faqTitle: 'Frequently asked questions',
    ctaTitle: 'Ready to eat smarter?',
    ctaText: 'Generate your first personalized weekly plan free — in under a minute.',
    genericFaqs: (title) => [
      {
        q: `Is this ${title.toLowerCase()} free?`,
        a: 'Yes. You can generate a plan on the free tier, with Premium unlocking unlimited plans, unlimited AI swaps and a 7-day free trial.',
      },
      {
        q: 'Can I set allergies and foods I dislike?',
        a: 'Absolutely. Set your allergies and disliked ingredients once and every plan Eatwise generates will respect them automatically.',
      },
    ],
  },
  ru: {
    benefitsTitle: 'Почему стоит собрать этот план в Eatwise',
    howTitle: 'Как это работает',
    how: [
      'Укажите цель по калориям, вкусовые предпочтения и аллергии.',
      'Eatwise собирает план на неделю с рецептами и КБЖУ для каждого приёма пищи.',
      'Получите список покупок по категориям и готовьте без лишних раздумий.',
    ],
    sampleTitle: 'Пример дня',
    faqTitle: 'Частые вопросы',
    ctaTitle: 'Готовы питаться умнее?',
    ctaText: 'Соберите свой первый персональный план на неделю бесплатно — меньше чем за минуту.',
    genericFaqs: () => [
      {
        q: 'Это бесплатно?',
        a: 'Да. План можно собрать на бесплатном тарифе, а Premium открывает безлимит планов, безлимитные ИИ-замены и 7 дней бесплатно.',
      },
      {
        q: 'Можно указать аллергии и нелюбимые продукты?',
        a: 'Конечно. Укажите аллергии и нежелательные ингредиенты один раз — каждый план Eatwise будет их учитывать автоматически.',
      },
    ],
  },
};

function build(lang: Lang, spec: PlanSpec): UseCase {
  const s = spec[lang];
  const sc = SCAFFOLD[lang];
  return {
    slug: spec.slug,
    emoji: spec.emoji,
    title: s.title,
    subtitle: s.subtitle,
    intro: s.intro,
    benefitsTitle: sc.benefitsTitle,
    benefits: s.benefits,
    howTitle: sc.howTitle,
    how: sc.how,
    sampleTitle: sc.sampleTitle,
    sample: s.sample,
    faqTitle: sc.faqTitle,
    faqs: [...s.faqs, ...sc.genericFaqs(s.title)],
    ctaTitle: sc.ctaTitle,
    ctaText: sc.ctaText,
  };
}

// ---------------------------------------------------------------------------
// Plan specifications. Ordered roughly by search demand.
// ---------------------------------------------------------------------------

const SPECS: PlanSpec[] = [
  // ------- Calorie-target plans -------
  {
    slug: '1200-calorie',
    emoji: '🥗',
    en: {
      title: '1200 Calorie Meal Plan',
      subtitle: 'A structured, satisfying 1200-calorie day built for steady, sustainable weight loss.',
      intro:
        'Eating around 1200 calories works for weight loss only when every calorie is nutrient-dense and filling. Eatwise balances protein, fiber and volume so 1200 calories actually keeps you full — no crash dieting, no math.',
      benefits: [
        { title: 'Filling on fewer calories', text: 'High-protein, high-fiber meals keep hunger down at a 1200-calorie target.' },
        { title: 'Nutrient-complete', text: 'Plans hit your vitamins and minerals so a low calorie count never means low nutrition.' },
        { title: 'Balanced macros', text: 'Protein is prioritized to protect muscle while you lose fat.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Greek yogurt with berries and a spoon of granola (280 kcal)' },
        { meal: 'lunch', dish: 'Grilled chicken and quinoa salad (380 kcal)' },
        { meal: 'dinner', dish: 'Baked cod with roasted vegetables (400 kcal)' },
        { meal: 'snack', dish: 'Apple with a small handful of almonds (140 kcal)' },
      ],
      faqs: [
        { q: 'Is 1200 calories a day safe?', a: 'For many adults it supports gradual weight loss, but the right number depends on your body and activity. Eatwise lets you adjust the target, and you should check with a professional if unsure.' },
        { q: 'Will I be hungry on 1200 calories?', a: 'Not if the food is chosen well. Eatwise front-loads protein, fiber and high-volume foods so the plan stays satisfying.' },
      ],
    },
    ru: {
      title: 'План питания на 1200 калорий',
      subtitle: 'Продуманный и сытный день на 1200 калорий для стабильного похудения.',
      intro:
        'Рацион на 1200 калорий работает для похудения только тогда, когда каждая калория питательна и насыщает. Eatwise балансирует белок, клетчатку и объём порций, чтобы 1200 калорий действительно насыщали — без жёстких диет и подсчётов.',
      benefits: [
        { title: 'Сытно при меньших калориях', text: 'Много белка и клетчатки удерживают голод даже на 1200 ккал.' },
        { title: 'Полноценный рацион', text: 'План закрывает витамины и минералы — мало калорий не значит мало пользы.' },
        { title: 'Сбалансированные КБЖУ', text: 'Белок в приоритете, чтобы сохранить мышцы при похудении.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Греческий йогурт с ягодами и ложкой гранолы (280 ккал)' },
        { meal: 'lunch', dish: 'Салат с курицей гриль и киноа (380 ккал)' },
        { meal: 'dinner', dish: 'Запечённая треска с овощами (400 ккал)' },
        { meal: 'snack', dish: 'Яблоко с горстью миндаля (140 ккал)' },
      ],
      faqs: [
        { q: 'Безопасно ли есть 1200 калорий в день?', a: 'Для многих взрослых это поддерживает плавное похудение, но норма зависит от тела и активности. В Eatwise можно менять цель, а при сомнениях лучше проконсультироваться со специалистом.' },
        { q: 'Буду ли я голодным на 1200 калориях?', a: 'Нет, если продукты подобраны правильно. Eatwise делает упор на белок, клетчатку и объёмные блюда, чтобы план насыщал.' },
      ],
    },
  },
  {
    slug: '1500-calorie',
    emoji: '🍽️',
    en: {
      title: '1500 Calorie Meal Plan',
      subtitle: 'A flexible 1500-calorie day that trims fat while keeping meals genuinely enjoyable.',
      intro:
        '1500 calories is a popular sweet spot for gradual weight loss with room for variety. Eatwise spreads those calories across balanced meals and snacks so you never feel deprived while the scale moves.',
      benefits: [
        { title: 'Room for variety', text: '1500 calories leaves space for real meals, snacks and the foods you love.' },
        { title: 'Steady fat loss', text: 'A moderate deficit that is easier to sustain than crash diets.' },
        { title: 'Protein-forward', text: 'Each day hits a protein goal to preserve lean muscle.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Veggie omelette with whole-grain toast (350 kcal)' },
        { meal: 'lunch', dish: 'Turkey and avocado wrap with side salad (450 kcal)' },
        { meal: 'dinner', dish: 'Stir-fried tofu with brown rice and broccoli (500 kcal)' },
        { meal: 'snack', dish: 'Cottage cheese with pineapple (200 kcal)' },
      ],
      faqs: [
        { q: 'How much weight can I lose on 1500 calories?', a: 'It depends on your starting point and activity, but a 1500-calorie plan typically creates a moderate, sustainable deficit for many adults.' },
        { q: 'Can I eat out on this plan?', a: 'Yes. Eatwise helps you budget calories across the day so you can leave room for a meal out.' },
      ],
    },
    ru: {
      title: 'План питания на 1500 калорий',
      subtitle: 'Гибкий день на 1500 калорий: снижает жир и при этом оставляет удовольствие от еды.',
      intro:
        '1500 калорий — популярный баланс для плавного похудения с простором для разнообразия. Eatwise распределяет их по сбалансированным приёмам пищи и перекусам, чтобы не было чувства лишений, пока вес снижается.',
      benefits: [
        { title: 'Простор для разнообразия', text: '1500 калорий оставляют место для полноценных блюд, перекусов и любимой еды.' },
        { title: 'Стабильное снижение жира', text: 'Умеренный дефицит, который легче выдержать, чем жёсткие диеты.' },
        { title: 'Упор на белок', text: 'Каждый день закрывает норму белка, чтобы сохранить мышцы.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Омлет с овощами и цельнозерновой тост (350 ккал)' },
        { meal: 'lunch', dish: 'Ролл с индейкой и авокадо и салат (450 ккал)' },
        { meal: 'dinner', dish: 'Тофу с бурым рисом и брокколи (500 ккал)' },
        { meal: 'snack', dish: 'Творог с ананасом (200 ккал)' },
      ],
      faqs: [
        { q: 'Сколько можно похудеть на 1500 калориях?', a: 'Зависит от исходной точки и активности, но план на 1500 калорий обычно создаёт умеренный и устойчивый дефицит для многих взрослых.' },
        { q: 'Можно ли есть вне дома на этом плане?', a: 'Да. Eatwise помогает распределить калории по дню, чтобы оставить место для похода в кафе.' },
      ],
    },
  },
  {
    slug: '1800-calorie',
    emoji: '🍲',
    en: {
      title: '1800 Calorie Meal Plan',
      subtitle: 'A balanced 1800-calorie day for maintenance or gentle, active weight loss.',
      intro:
        '1800 calories suits active people maintaining weight or losing slowly without a harsh deficit. Eatwise fills the day with balanced, energizing meals that fuel workouts and busy schedules.',
      benefits: [
        { title: 'Energy for active days', text: 'Enough fuel for training and a full schedule without overeating.' },
        { title: 'Balanced plate', text: 'Even split of protein, carbs and healthy fats at every meal.' },
        { title: 'Flexible', text: 'Works for maintenance or a light deficit depending on your goal.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Oatmeal with banana, peanut butter and chia (450 kcal)' },
        { meal: 'lunch', dish: 'Chicken burrito bowl with beans and rice (550 kcal)' },
        { meal: 'dinner', dish: 'Salmon with sweet potato and greens (600 kcal)' },
        { meal: 'snack', dish: 'Protein smoothie (200 kcal)' },
      ],
      faqs: [
        { q: 'Who is an 1800 calorie plan for?', a: 'It fits many active adults maintaining their weight, or those aiming for slow, comfortable weight loss.' },
        { q: 'Can I train on 1800 calories?', a: 'Yes. The plan spreads carbs and protein to support workouts and recovery.' },
      ],
    },
    ru: {
      title: 'План питания на 1800 калорий',
      subtitle: 'Сбалансированный день на 1800 калорий для поддержания веса или мягкого похудения.',
      intro:
        '1800 калорий подходят активным людям, которые держат вес или худеют плавно без жёсткого дефицита. Eatwise наполняет день сбалансированными и энергичными блюдами для тренировок и плотного графика.',
      benefits: [
        { title: 'Энергия для активных дней', text: 'Достаточно топлива для тренировок и загруженного дня без переедания.' },
        { title: 'Сбалансированная тарелка', text: 'Ровное распределение белков, углеводов и полезных жиров.' },
        { title: 'Гибкость', text: 'Подходит для поддержания или лёгкого дефицита в зависимости от цели.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Овсянка с бананом, арахисовой пастой и чиа (450 ккал)' },
        { meal: 'lunch', dish: 'Боул с курицей, фасолью и рисом (550 ккал)' },
        { meal: 'dinner', dish: 'Лосось с бататом и зеленью (600 ккал)' },
        { meal: 'snack', dish: 'Протеиновый смузи (200 ккал)' },
      ],
      faqs: [
        { q: 'Кому подходит план на 1800 калорий?', a: 'Он подходит многим активным взрослым, которые держат вес, или тем, кто худеет медленно и комфортно.' },
        { q: 'Можно ли тренироваться на 1800 калориях?', a: 'Да. План распределяет углеводы и белок для поддержки тренировок и восстановления.' },
      ],
    },
  },
  {
    slug: '2000-calorie',
    emoji: '🍛',
    en: {
      title: '2000 Calorie Meal Plan',
      subtitle: 'A well-rounded 2000-calorie day — the classic baseline for balanced eating.',
      intro:
        '2000 calories is the standard reference for a balanced adult diet. Eatwise turns that baseline into a varied, wholesome week so "eating normally" still means eating well.',
      benefits: [
        { title: 'Balanced baseline', text: 'A well-rounded 2000 calories across three meals and snacks.' },
        { title: 'Wholesome variety', text: 'Diverse ingredients keep meals interesting all week.' },
        { title: 'Goal-adjustable', text: 'Scale up or down anytime as your goals change.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Scrambled eggs, avocado toast and fruit (500 kcal)' },
        { meal: 'lunch', dish: 'Mediterranean grain bowl with falafel (600 kcal)' },
        { meal: 'dinner', dish: 'Lean beef stir-fry with noodles (650 kcal)' },
        { meal: 'snack', dish: 'Hummus with veggie sticks (250 kcal)' },
      ],
      faqs: [
        { q: 'Is 2000 calories good for weight loss?', a: 'For some people it maintains weight; for others it creates a small deficit. Eatwise lets you set the exact target for your goal.' },
        { q: 'Can I customize the 2000 calorie plan?', a: 'Yes — set your diet, allergies and tastes and every day is tailored to them.' },
      ],
    },
    ru: {
      title: 'План питания на 2000 калорий',
      subtitle: 'Полноценный день на 2000 калорий — классическая база для сбалансированного питания.',
      intro:
        '2000 калорий — стандартный ориентир для сбалансированного рациона взрослого. Eatwise превращает эту базу в разнообразную и полезную неделю, чтобы «питаться нормально» значило «питаться хорошо».',
      benefits: [
        { title: 'Сбалансированная база', text: 'Полноценные 2000 калорий на три приёма пищи и перекусы.' },
        { title: 'Полезное разнообразие', text: 'Разные продукты держат меню интересным всю неделю.' },
        { title: 'Подстраивается под цель', text: 'Увеличивайте или уменьшайте калораж в любой момент.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Яичница, тост с авокадо и фрукты (500 ккал)' },
        { meal: 'lunch', dish: 'Средиземноморский боул с фалафелем (600 ккал)' },
        { meal: 'dinner', dish: 'Постная говядина с лапшой (650 ккал)' },
        { meal: 'snack', dish: 'Хумус с овощными палочками (250 ккал)' },
      ],
      faqs: [
        { q: 'Подходят ли 2000 калорий для похудения?', a: 'Кому-то это поддерживает вес, кому-то создаёт небольшой дефицит. В Eatwise можно задать точную цель под свою задачу.' },
        { q: 'Можно ли настроить план на 2000 калорий?', a: 'Да — укажите диету, аллергии и вкусы, и каждый день будет подобран под них.' },
      ],
    },
  },

  // ------- Diet-type plans -------
  {
    slug: 'vegan',
    emoji: '🌱',
    en: {
      title: 'Vegan Meal Plan Generator',
      subtitle: 'Fully plant-based weekly plans with complete protein and zero animal products.',
      intro:
        'Eating vegan well means covering protein, iron, B12 and variety — not just removing meat. Eatwise builds balanced plant-based weeks with satisfying, protein-complete meals and a ready shopping list.',
      benefits: [
        { title: 'Complete plant protein', text: 'Legumes, tofu, tempeh and grains combined to hit your protein goal.' },
        { title: 'Nutrient-aware', text: 'Iron- and B12-rich foods worked into the plan intentionally.' },
        { title: 'Never boring', text: 'Global plant-based recipes so vegan eating stays exciting.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Tofu scramble with spinach and whole-grain toast' },
        { meal: 'lunch', dish: 'Chickpea and quinoa Buddha bowl' },
        { meal: 'dinner', dish: 'Lentil dhal with brown rice' },
        { meal: 'snack', dish: 'Edamame with sea salt' },
      ],
      faqs: [
        { q: 'Will I get enough protein on a vegan plan?', a: 'Yes. Eatwise combines legumes, soy and grains across the day to reach your protein target.' },
        { q: 'Is this good for beginners going vegan?', a: 'Definitely — the plan handles the balance and shopping so switching to plant-based is simple.' },
      ],
    },
    ru: {
      title: 'Генератор веганского плана питания',
      subtitle: 'Полностью растительные планы на неделю с полноценным белком и без продуктов животного происхождения.',
      intro:
        'Питаться вегански правильно — значит закрывать белок, железо, B12 и разнообразие, а не просто убрать мясо. Eatwise собирает сбалансированные растительные недели с сытными блюдами и готовым списком покупок.',
      benefits: [
        { title: 'Полноценный растительный белок', text: 'Бобовые, тофу, темпе и злаки в сочетаниях под вашу норму белка.' },
        { title: 'Учёт нутриентов', text: 'Продукты, богатые железом и B12, включены в план осознанно.' },
        { title: 'Никакой скуки', text: 'Растительные рецепты со всего мира держат интерес.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Скрэмбл из тофу со шпинатом и цельнозерновой тост' },
        { meal: 'lunch', dish: 'Будда-боул с нутом и киноа' },
        { meal: 'dinner', dish: 'Дал из чечевицы с бурым рисом' },
        { meal: 'snack', dish: 'Эдамаме с морской солью' },
      ],
      faqs: [
        { q: 'Хватит ли белка на веганском плане?', a: 'Да. Eatwise сочетает бобовые, сою и злаки в течение дня, чтобы закрыть норму белка.' },
        { q: 'Подойдёт ли новичку в веганстве?', a: 'Определённо — план берёт на себя баланс и покупки, так что переход на растительное питание становится простым.' },
      ],
    },
  },
  {
    slug: 'mediterranean',
    emoji: '🫒',
    en: {
      title: 'Mediterranean Diet Meal Plan',
      subtitle: 'Heart-healthy weekly plans rich in olive oil, fish, vegetables and whole grains.',
      intro:
        'The Mediterranean diet is consistently ranked among the healthiest ways to eat. Eatwise builds authentic Mediterranean weeks — plenty of vegetables, olive oil, seafood and whole grains — tailored to your calories and tastes.',
      benefits: [
        { title: 'Heart-healthy fats', text: 'Olive oil, nuts and fish deliver good fats at every meal.' },
        { title: 'Veg-forward', text: 'Vegetables, legumes and whole grains anchor each day.' },
        { title: 'Naturally satisfying', text: 'Flavor-rich meals that feel indulgent while staying wholesome.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Greek yogurt with honey, walnuts and figs' },
        { meal: 'lunch', dish: 'Grilled sardines with tomato and white bean salad' },
        { meal: 'dinner', dish: 'Chicken souvlaki with tzatziki and couscous' },
        { meal: 'snack', dish: 'Olives, cucumber and feta' },
      ],
      faqs: [
        { q: 'Is the Mediterranean diet good for weight loss?', a: 'It can be, especially at the right calorie target. Eatwise sets your calories while keeping the plan authentically Mediterranean.' },
        { q: 'Do I have to eat fish?', a: 'No — you can reduce or remove seafood and Eatwise rebalances the plan around your preferences.' },
      ],
    },
    ru: {
      title: 'План питания средиземноморской диеты',
      subtitle: 'Полезные для сердца планы на неделю с оливковым маслом, рыбой, овощами и цельными злаками.',
      intro:
        'Средиземноморская диета стабильно входит в число самых здоровых способов питания. Eatwise собирает аутентичные средиземноморские недели — много овощей, оливковое масло, морепродукты и цельные злаки — под ваши калории и вкусы.',
      benefits: [
        { title: 'Полезные для сердца жиры', text: 'Оливковое масло, орехи и рыба дают хорошие жиры в каждом приёме пищи.' },
        { title: 'Упор на овощи', text: 'Овощи, бобовые и цельные злаки — основа каждого дня.' },
        { title: 'Естественно сытно', text: 'Насыщенные вкусом блюда ощущаются как удовольствие, оставаясь полезными.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Греческий йогурт с мёдом, грецкими орехами и инжиром' },
        { meal: 'lunch', dish: 'Сардины гриль с салатом из томатов и белой фасоли' },
        { meal: 'dinner', dish: 'Курица сувлаки с дзадзики и кускусом' },
        { meal: 'snack', dish: 'Оливки, огурец и фета' },
      ],
      faqs: [
        { q: 'Подходит ли средиземноморская диета для похудения?', a: 'Может подходить, особенно при правильной цели по калориям. Eatwise задаёт калораж, сохраняя план аутентично средиземноморским.' },
        { q: 'Обязательно ли есть рыбу?', a: 'Нет — можно уменьшить или убрать морепродукты, и Eatwise перестроит план под ваши предпочтения.' },
      ],
    },
  },
  {
    slug: 'low-carb',
    emoji: '🥩',
    en: {
      title: 'Low-Carb Meal Plan',
      subtitle: 'Weekly plans that cut refined carbs while keeping meals hearty and satisfying.',
      intro:
        'A low-carb approach reduces sugar and refined starch to steady energy and appetite — without the strict limits of full keto. Eatwise builds balanced low-carb weeks around protein, vegetables and healthy fats.',
      benefits: [
        { title: 'Steady energy', text: 'Fewer blood-sugar spikes means fewer crashes and cravings.' },
        { title: 'Hearty meals', text: 'Protein and healthy fats keep the plan filling and satisfying.' },
        { title: 'Less restrictive than keto', text: 'Moderate carbs give more food freedom than strict keto.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Eggs with sautéed mushrooms and avocado' },
        { meal: 'lunch', dish: 'Chicken Cobb salad with olive-oil dressing' },
        { meal: 'dinner', dish: 'Pork chop with cauliflower mash and green beans' },
        { meal: 'snack', dish: 'Cheese and cucumber slices' },
      ],
      faqs: [
        { q: 'How is low-carb different from keto?', a: 'Low-carb reduces carbs moderately, while keto keeps them very low to reach ketosis. Low-carb allows more variety and flexibility.' },
        { q: 'Can I still eat fruit?', a: 'Yes, in moderation — Eatwise fits lower-sugar fruits into your carb budget.' },
      ],
    },
    ru: {
      title: 'Низкоуглеводный план питания',
      subtitle: 'Планы на неделю, которые убирают быстрые углеводы, оставляя блюда сытными.',
      intro:
        'Низкоуглеводный подход снижает сахар и рафинированный крахмал ради ровной энергии и аппетита — без жёстких ограничений полноценного кето. Eatwise собирает сбалансированные недели вокруг белка, овощей и полезных жиров.',
      benefits: [
        { title: 'Ровная энергия', text: 'Меньше скачков сахара — меньше упадков сил и тяги к сладкому.' },
        { title: 'Сытные блюда', text: 'Белок и полезные жиры делают план насыщающим.' },
        { title: 'Мягче, чем кето', text: 'Умеренные углеводы дают больше свободы в еде, чем строгое кето.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Яйца с обжаренными грибами и авокадо' },
        { meal: 'lunch', dish: 'Салат Кобб с курицей и заправкой на оливковом масле' },
        { meal: 'dinner', dish: 'Свиная отбивная с пюре из цветной капусты и стручковой фасолью' },
        { meal: 'snack', dish: 'Сыр и ломтики огурца' },
      ],
      faqs: [
        { q: 'Чем низкоуглеводка отличается от кето?', a: 'Низкоуглеводка умеренно снижает углеводы, а кето держит их очень низко для кетоза. Низкоуглеводка допускает больше разнообразия и гибкости.' },
        { q: 'Можно ли есть фрукты?', a: 'Да, умеренно — Eatwise вписывает менее сладкие фрукты в ваш лимит углеводов.' },
      ],
    },
  },
  {
    slug: 'gluten-free',
    emoji: '🌾',
    en: {
      title: 'Gluten-Free Meal Plan',
      subtitle: 'Naturally gluten-free weekly plans that are safe, varied and never bland.',
      intro:
        'Going gluten-free means more than swapping bread — it means avoiding hidden gluten while keeping meals balanced. Eatwise builds naturally gluten-free weeks with whole foods and safe substitutes.',
      benefits: [
        { title: 'No hidden gluten', text: 'Plans use naturally gluten-free whole foods and safe swaps.' },
        { title: 'Balanced, not bland', text: 'Varied grains like rice, quinoa and buckwheat keep meals interesting.' },
        { title: 'Allergy-aware', text: 'Combine gluten-free with other allergies in one plan.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Buckwheat porridge with berries' },
        { meal: 'lunch', dish: 'Rice bowl with grilled chicken and veggies' },
        { meal: 'dinner', dish: 'Zucchini noodles with turkey meatballs' },
        { meal: 'snack', dish: 'Rice cakes with almond butter' },
      ],
      faqs: [
        { q: 'Is this plan safe for celiac disease?', a: 'Eatwise builds naturally gluten-free plans, but always check product labels for certified gluten-free status if you have celiac disease.' },
        { q: 'Can I combine gluten-free with other diets?', a: 'Yes — pair it with vegetarian, low-carb or other preferences and Eatwise handles the overlap.' },
      ],
    },
    ru: {
      title: 'Безглютеновый план питания',
      subtitle: 'Естественно безглютеновые планы на неделю — безопасные, разнообразные и не пресные.',
      intro:
        'Безглютеновое питание — это не только замена хлеба, но и отказ от скрытого глютена при сохранении баланса. Eatwise собирает естественно безглютеновые недели из цельных продуктов и безопасных замен.',
      benefits: [
        { title: 'Без скрытого глютена', text: 'В планах используются естественно безглютеновые продукты и безопасные замены.' },
        { title: 'Сбалансированно, не пресно', text: 'Разные крупы — рис, киноа, гречка — держат меню интересным.' },
        { title: 'Учёт аллергий', text: 'Можно совместить безглютеновое с другими аллергиями в одном плане.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Гречневая каша с ягодами' },
        { meal: 'lunch', dish: 'Рисовый боул с курицей гриль и овощами' },
        { meal: 'dinner', dish: 'Лапша из цукини с фрикадельками из индейки' },
        { meal: 'snack', dish: 'Рисовые хлебцы с миндальной пастой' },
      ],
      faqs: [
        { q: 'Безопасен ли план при целиакии?', a: 'Eatwise собирает естественно безглютеновые планы, но при целиакии всегда проверяйте маркировку продуктов на сертифицированный статус «без глютена».' },
        { q: 'Можно ли совмещать с другими диетами?', a: 'Да — сочетайте с вегетарианством, низкоуглеводкой и другими предпочтениями, Eatwise учтёт пересечения.' },
      ],
    },
  },
  {
    slug: 'diabetic',
    emoji: '🩸',
    en: {
      title: 'Diabetic-Friendly Meal Plan',
      subtitle: 'Balanced, lower-glycemic weekly plans designed to support steady blood sugar.',
      intro:
        'Managing blood sugar is about balance and consistency across the day. Eatwise builds lower-glycemic, fiber-rich plans with steady carbs and plenty of protein to help keep energy and glucose stable.',
      benefits: [
        { title: 'Steadier blood sugar', text: 'Balanced carbs, fiber and protein help avoid big glucose spikes.' },
        { title: 'Consistent portions', text: 'Even carb distribution across meals for predictable days.' },
        { title: 'Whole-food focus', text: 'Minimally processed ingredients with lower added sugar.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Steel-cut oats with cinnamon, chia and berries' },
        { meal: 'lunch', dish: 'Lentil soup with a mixed green salad' },
        { meal: 'dinner', dish: 'Grilled chicken with quinoa and roasted veg' },
        { meal: 'snack', dish: 'Greek yogurt with a few nuts' },
      ],
      faqs: [
        { q: 'Is this a substitute for medical advice?', a: 'No. Eatwise helps build balanced, lower-glycemic meals, but always follow guidance from your doctor or dietitian for managing diabetes.' },
        { q: 'Can I set a carb target per meal?', a: 'Yes — adjust your calorie and carb preferences and Eatwise distributes carbs evenly across the day.' },
      ],
    },
    ru: {
      title: 'План питания при диабете',
      subtitle: 'Сбалансированные планы с низким гликемическим индексом для стабильного сахара.',
      intro:
        'Контроль сахара — это про баланс и постоянство в течение дня. Eatwise собирает планы с низким ГИ, богатые клетчаткой, с равномерными углеводами и белком, чтобы поддерживать стабильную энергию и глюкозу.',
      benefits: [
        { title: 'Более стабильный сахар', text: 'Сбалансированные углеводы, клетчатка и белок помогают избегать резких скачков.' },
        { title: 'Постоянные порции', text: 'Равномерное распределение углеводов по приёмам пищи для предсказуемых дней.' },
        { title: 'Упор на цельные продукты', text: 'Минимально обработанные ингредиенты с меньшим количеством добавленного сахара.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Овсянка грубого помола с корицей, чиа и ягодами' },
        { meal: 'lunch', dish: 'Чечевичный суп с салатом из зелени' },
        { meal: 'dinner', dish: 'Курица гриль с киноа и запечёнными овощами' },
        { meal: 'snack', dish: 'Греческий йогурт с горстью орехов' },
      ],
      faqs: [
        { q: 'Заменяет ли это рекомендации врача?', a: 'Нет. Eatwise помогает собрать сбалансированные блюда с низким ГИ, но при диабете всегда следуйте указаниям врача или диетолога.' },
        { q: 'Можно ли задать норму углеводов на приём пищи?', a: 'Да — настройте предпочтения по калориям и углеводам, и Eatwise распределит углеводы равномерно по дню.' },
      ],
    },
  },
  {
    slug: 'intermittent-fasting',
    emoji: '⏱️',
    en: {
      title: 'Intermittent Fasting Meal Plan',
      subtitle: 'Structured plans for 16:8 and other fasting windows — filling meals, no snacking gaps.',
      intro:
        'Intermittent fasting works best when your eating window is packed with balanced, satiating meals. Eatwise plans your calories and protein into a shorter window so you stay full and energized between fasts.',
      benefits: [
        { title: 'Window-optimized', text: 'Calories and protein fit neatly into your chosen eating window.' },
        { title: 'High satiety', text: 'Filling, protein-rich meals help you get through the fasting hours.' },
        { title: 'Flexible schedules', text: 'Works with 16:8, 14:10 and other common fasting patterns.' },
      ],
      sample: [
        { meal: 'lunch', dish: 'Break-fast bowl: eggs, avocado, greens and quinoa' },
        { meal: 'snack', dish: 'Cottage cheese with berries and seeds' },
        { meal: 'dinner', dish: 'Salmon with roasted potatoes and broccoli' },
        { meal: 'snack', dish: 'Dark chocolate and a handful of nuts' },
      ],
      faqs: [
        { q: 'Which fasting window does this support?', a: 'Eatwise fits your calories into whatever window you use — 16:8 is most common, but 14:10 and others work too.' },
        { q: 'Will two meals keep me full?', a: 'Yes, when they are protein- and fiber-rich. Eatwise designs the window to maximize satiety.' },
      ],
    },
    ru: {
      title: 'План питания для интервального голодания',
      subtitle: 'Планы для 16:8 и других окон питания — сытные приёмы пищи без провалов.',
      intro:
        'Интервальное голодание работает лучше, когда окно питания заполнено сбалансированными и насыщающими блюдами. Eatwise распределяет калории и белок в более короткое окно, чтобы вы были сыты и полны сил между голоданиями.',
      benefits: [
        { title: 'Оптимизировано под окно', text: 'Калории и белок аккуратно вписываются в выбранное окно питания.' },
        { title: 'Высокая сытость', text: 'Насыщающие блюда с белком помогают пройти часы голодания.' },
        { title: 'Гибкий график', text: 'Подходит для 16:8, 14:10 и других распространённых схем.' },
      ],
      sample: [
        { meal: 'lunch', dish: 'Боул на выход из голодания: яйца, авокадо, зелень и киноа' },
        { meal: 'snack', dish: 'Творог с ягодами и семечками' },
        { meal: 'dinner', dish: 'Лосось с запечённым картофелем и брокколи' },
        { meal: 'snack', dish: 'Тёмный шоколад и горсть орехов' },
      ],
      faqs: [
        { q: 'Какое окно голодания поддерживается?', a: 'Eatwise вписывает калории в любое ваше окно — чаще всего 16:8, но 14:10 и другие тоже подходят.' },
        { q: 'Насытят ли два приёма пищи?', a: 'Да, если они богаты белком и клетчаткой. Eatwise проектирует окно так, чтобы максимизировать сытость.' },
      ],
    },
  },

  // ------- Goal-based plans -------
  {
    slug: 'muscle-gain',
    emoji: '💪',
    en: {
      title: 'Muscle Gain Meal Plan',
      subtitle: 'High-protein, calorie-surplus weekly plans built to fuel muscle growth.',
      intro:
        'Building muscle needs a modest calorie surplus and enough protein to support training. Eatwise plans a protein-rich week with the right surplus so you grow lean mass without unnecessary fat gain.',
      benefits: [
        { title: 'Protein at every meal', text: 'Hits a high daily protein target to support muscle repair and growth.' },
        { title: 'Smart surplus', text: 'A controlled calorie surplus for lean gains, not sloppy bulking.' },
        { title: 'Training fuel', text: 'Carbs timed to power workouts and recovery.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Egg and oat protein pancakes with banana' },
        { meal: 'lunch', dish: 'Chicken, rice and black beans with salsa' },
        { meal: 'dinner', dish: 'Steak with potatoes and roasted vegetables' },
        { meal: 'snack', dish: 'Protein shake with peanut butter' },
      ],
      faqs: [
        { q: 'How much protein will the plan include?', a: 'Eatwise targets a high daily protein intake appropriate to your bodyweight and training goals.' },
        { q: 'Will I gain fat on a bulk?', a: 'A controlled surplus minimizes fat gain. Eatwise keeps the surplus moderate for lean muscle growth.' },
      ],
    },
    ru: {
      title: 'План питания для набора мышц',
      subtitle: 'Высокобелковые планы с профицитом калорий для роста мышц.',
      intro:
        'Для роста мышц нужен умеренный профицит калорий и достаточно белка для тренировок. Eatwise планирует богатую белком неделю с правильным профицитом, чтобы набирать сухую массу без лишнего жира.',
      benefits: [
        { title: 'Белок в каждом приёме пищи', text: 'Закрывает высокую дневную норму белка для восстановления и роста мышц.' },
        { title: 'Умный профицит', text: 'Контролируемый профицит калорий для сухого набора, а не грязного «массонабора».' },
        { title: 'Топливо для тренировок', text: 'Углеводы распределены под тренировки и восстановление.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Протеиновые панкейки из яиц и овсянки с бананом' },
        { meal: 'lunch', dish: 'Курица, рис и чёрная фасоль с сальсой' },
        { meal: 'dinner', dish: 'Стейк с картофелем и запечёнными овощами' },
        { meal: 'snack', dish: 'Протеиновый коктейль с арахисовой пастой' },
      ],
      faqs: [
        { q: 'Сколько белка будет в плане?', a: 'Eatwise ориентируется на высокую дневную норму белка под ваш вес и цели тренировок.' },
        { q: 'Наберу ли я жир на массе?', a: 'Контролируемый профицит минимизирует набор жира. Eatwise держит профицит умеренным для сухого роста мышц.' },
      ],
    },
  },
  {
    slug: 'weight-gain',
    emoji: '⚖️',
    en: {
      title: 'Healthy Weight Gain Meal Plan',
      subtitle: 'Calorie-dense yet wholesome plans to gain weight steadily and healthily.',
      intro:
        'Gaining weight in a healthy way means adding nutrient-dense calories, not just junk food. Eatwise builds calorie-dense weeks with balanced macros so you gain steadily while staying well-nourished.',
      benefits: [
        { title: 'Calorie-dense, not empty', text: 'Nutritious high-calorie foods make hitting a surplus easier.' },
        { title: 'Balanced gains', text: 'Enough protein to add muscle, not only fat.' },
        { title: 'Easy to eat', text: 'Smoothies and energy-dense snacks help when appetite is low.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Oats with whole milk, peanut butter, banana and honey' },
        { meal: 'lunch', dish: 'Salmon with rice, avocado and olive oil' },
        { meal: 'dinner', dish: 'Beef pasta with cheese and a side salad' },
        { meal: 'snack', dish: 'Trail mix and a mass-gainer smoothie' },
      ],
      faqs: [
        { q: 'How fast will I gain weight?', a: 'A steady surplus adds weight gradually and healthily. Eatwise lets you set the surplus size to match your goal.' },
        { q: 'Is this just eating junk food?', a: 'No — the plan uses nutrient-dense, calorie-rich whole foods so you gain weight without harming your health.' },
      ],
    },
    ru: {
      title: 'План питания для здорового набора веса',
      subtitle: 'Калорийные, но полезные планы для плавного и здорового набора веса.',
      intro:
        'Набирать вес здорово — значит добавлять питательные калории, а не фастфуд. Eatwise собирает калорийные недели со сбалансированными КБЖУ, чтобы вы набирали стабильно и при этом хорошо питались.',
      benefits: [
        { title: 'Калорийно, но не пусто', text: 'Питательные калорийные продукты облегчают выход в профицит.' },
        { title: 'Сбалансированный набор', text: 'Достаточно белка, чтобы набирать мышцы, а не только жир.' },
        { title: 'Легко съедать', text: 'Смузи и калорийные перекусы помогают при слабом аппетите.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Овсянка на цельном молоке с арахисовой пастой, бананом и мёдом' },
        { meal: 'lunch', dish: 'Лосось с рисом, авокадо и оливковым маслом' },
        { meal: 'dinner', dish: 'Паста с говядиной, сыром и салатом' },
        { meal: 'snack', dish: 'Смесь орехов и гейнер-смузи' },
      ],
      faqs: [
        { q: 'Как быстро я наберу вес?', a: 'Стабильный профицит добавляет вес плавно и здорово. В Eatwise можно задать размер профицита под вашу цель.' },
        { q: 'Это просто поедание вредной еды?', a: 'Нет — план использует питательные калорийные цельные продукты, чтобы набирать вес без вреда для здоровья.' },
      ],
    },
  },
  {
    slug: 'maintenance',
    emoji: '🎯',
    en: {
      title: 'Weight Maintenance Meal Plan',
      subtitle: 'Balanced weekly plans to hold your weight and eat well without tracking every bite.',
      intro:
        'Maintaining weight is about consistency, not restriction. Eatwise builds balanced weeks at your maintenance calories so you keep your results while enjoying varied, satisfying food.',
      benefits: [
        { title: 'Effortless consistency', text: 'Balanced days at maintenance calories take the guesswork out.' },
        { title: 'Full variety', text: 'A wide range of foods keeps eating enjoyable long-term.' },
        { title: 'Habit-friendly', text: 'Sustainable structure that is easy to keep up for good.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Whole-grain toast with eggs and avocado' },
        { meal: 'lunch', dish: 'Grain bowl with chicken, veg and tahini' },
        { meal: 'dinner', dish: 'Shrimp tacos with slaw' },
        { meal: 'snack', dish: 'Fruit and a handful of nuts' },
      ],
      faqs: [
        { q: 'How do I find my maintenance calories?', a: 'Eatwise estimates them from your details and lets you fine-tune, so days land at the level that holds your weight.' },
        { q: 'Can I switch to weight loss later?', a: 'Anytime — just change your goal and Eatwise adjusts your plan accordingly.' },
      ],
    },
    ru: {
      title: 'План питания для поддержания веса',
      subtitle: 'Сбалансированные планы, чтобы держать вес и хорошо питаться без подсчёта каждого куска.',
      intro:
        'Поддержание веса — это про постоянство, а не ограничения. Eatwise собирает сбалансированные недели на калориях поддержания, чтобы вы сохраняли результат и наслаждались разнообразной едой.',
      benefits: [
        { title: 'Лёгкое постоянство', text: 'Сбалансированные дни на калориях поддержания убирают догадки.' },
        { title: 'Полное разнообразие', text: 'Широкий выбор продуктов делает питание приятным надолго.' },
        { title: 'Удобно для привычек', text: 'Устойчивая структура, которую легко поддерживать постоянно.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Цельнозерновой тост с яйцами и авокадо' },
        { meal: 'lunch', dish: 'Боул с курицей, овощами и тахини' },
        { meal: 'dinner', dish: 'Тако с креветками и капустным салатом' },
        { meal: 'snack', dish: 'Фрукты и горсть орехов' },
      ],
      faqs: [
        { q: 'Как найти калории поддержания?', a: 'Eatwise оценивает их по вашим данным и позволяет донастроить, чтобы дни выходили на уровень, удерживающий вес.' },
        { q: 'Можно ли потом перейти на похудение?', a: 'В любой момент — просто смените цель, и Eatwise перестроит план.' },
      ],
    },
  },

  // ------- Lifestyle plans -------
  {
    slug: 'budget',
    emoji: '💰',
    en: {
      title: 'Budget Meal Plan',
      subtitle: 'Affordable weekly plans that eat well for less, with a cost-smart shopping list.',
      intro:
        'Eating healthy on a budget is about smart staples and zero waste. Eatwise builds affordable weeks around inexpensive, versatile ingredients and a shopping list that stretches every dollar.',
      benefits: [
        { title: 'Cost-smart staples', text: 'Beans, eggs, oats and seasonal veg keep costs low and nutrition high.' },
        { title: 'Zero waste', text: 'Ingredients reused across meals so nothing is thrown away.' },
        { title: 'One efficient shop', text: 'A consolidated list means fewer trips and less overspending.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Oatmeal with banana and peanut butter' },
        { meal: 'lunch', dish: 'Rice and beans with fried egg' },
        { meal: 'dinner', dish: 'Vegetable and lentil curry' },
        { meal: 'snack', dish: 'Carrot sticks and yogurt' },
      ],
      faqs: [
        { q: 'How cheap can the plan be?', a: 'Eatwise leans on affordable staples and reuse, so you can eat balanced meals for a fraction of typical grocery costs.' },
        { q: 'Is budget food still healthy?', a: 'Yes — inexpensive whole foods like legumes, eggs and oats are among the most nutritious per dollar.' },
      ],
    },
    ru: {
      title: 'Бюджетный план питания',
      subtitle: 'Доступные планы на неделю: питаться хорошо за меньшие деньги и с экономным списком покупок.',
      intro:
        'Питаться здорово на бюджете — это про умные базовые продукты и отсутствие отходов. Eatwise собирает доступные недели вокруг недорогих универсальных ингредиентов и списка покупок, который растягивает каждый рубль.',
      benefits: [
        { title: 'Умные базовые продукты', text: 'Фасоль, яйца, овсянка и сезонные овощи держат расходы низкими, а пользу высокой.' },
        { title: 'Ноль отходов', text: 'Ингредиенты переиспользуются между блюдами, ничего не выбрасывается.' },
        { title: 'Одна удобная закупка', text: 'Единый список — меньше походов в магазин и меньше лишних трат.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Овсянка с бананом и арахисовой пастой' },
        { meal: 'lunch', dish: 'Рис с фасолью и жареным яйцом' },
        { meal: 'dinner', dish: 'Овощное карри с чечевицей' },
        { meal: 'snack', dish: 'Морковные палочки и йогурт' },
      ],
      faqs: [
        { q: 'Насколько дешёвым может быть план?', a: 'Eatwise опирается на доступные базовые продукты и переиспользование, так что сбалансированно питаться можно за долю обычных затрат.' },
        { q: 'Бюджетная еда всё ещё полезна?', a: 'Да — недорогие цельные продукты вроде бобовых, яиц и овсянки одни из самых питательных на рубль.' },
      ],
    },
  },
  {
    slug: 'family',
    emoji: '👨‍👩‍👧‍👦',
    en: {
      title: 'Family Meal Plan',
      subtitle: 'Crowd-pleasing weekly plans the whole family will actually eat.',
      intro:
        'Feeding a family means balancing nutrition, variety and picky eaters — on a schedule. Eatwise plans wholesome, familiar meals that scale to your household with one easy shopping list.',
      benefits: [
        { title: 'Everyone eats', text: 'Familiar, crowd-pleasing meals that satisfy adults and kids alike.' },
        { title: 'Scales to your household', text: 'Portions adjust to the number of people you cook for.' },
        { title: 'One shopping list', text: 'A single consolidated list for the whole week.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Whole-grain pancakes with fruit' },
        { meal: 'lunch', dish: 'Chicken and veggie pasta bake' },
        { meal: 'dinner', dish: 'Homemade beef tacos with toppings bar' },
        { meal: 'snack', dish: 'Yogurt parfaits' },
      ],
      faqs: [
        { q: 'Can it handle picky eaters?', a: 'Yes — set disliked foods for the household and Eatwise steers toward meals everyone will enjoy.' },
        { q: 'Can I scale portions for a big family?', a: 'Absolutely. Eatwise adjusts quantities and the shopping list to your family size.' },
      ],
    },
    ru: {
      title: 'Семейный план питания',
      subtitle: 'Планы на неделю, которые понравятся всей семье и которые реально будут есть.',
      intro:
        'Кормить семью — значит балансировать пользу, разнообразие и привередливых едоков, да ещё по графику. Eatwise планирует полезные и привычные блюда, которые масштабируются на вашу семью с одним удобным списком покупок.',
      benefits: [
        { title: 'Едят все', text: 'Привычные и любимые блюда, которые нравятся и взрослым, и детям.' },
        { title: 'Масштаб под семью', text: 'Порции подстраиваются под количество едоков.' },
        { title: 'Один список покупок', text: 'Единый сводный список на всю неделю.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Цельнозерновые панкейки с фруктами' },
        { meal: 'lunch', dish: 'Запеканка из пасты с курицей и овощами' },
        { meal: 'dinner', dish: 'Домашние тако с говядиной и начинками на выбор' },
        { meal: 'snack', dish: 'Йогуртовые парфе' },
      ],
      faqs: [
        { q: 'Справится ли с привередливыми едоками?', a: 'Да — укажите нелюбимые продукты для семьи, и Eatwise будет подбирать блюда, которые понравятся всем.' },
        { q: 'Можно ли увеличить порции для большой семьи?', a: 'Конечно. Eatwise подстроит количество и список покупок под размер семьи.' },
      ],
    },
  },
  {
    slug: 'meal-prep',
    emoji: '🥡',
    en: {
      title: 'Meal Prep Plan',
      subtitle: 'Batch-cook-friendly weekly plans that make prepping ahead simple and fast.',
      intro:
        'Meal prepping saves time and keeps you on track — if the recipes are built for it. Eatwise plans batch-friendly meals that store and reheat well, so a couple of cook sessions cover your whole week.',
      benefits: [
        { title: 'Batch-friendly recipes', text: 'Meals chosen to cook in bulk and reheat without losing quality.' },
        { title: 'Save hours weekly', text: 'A couple of prep sessions cover several days of eating.' },
        { title: 'Less waste, less spend', text: 'Shared ingredients across recipes cut cost and food waste.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Overnight oats jars (make 5 at once)' },
        { meal: 'lunch', dish: 'Chicken, rice and roasted veg containers' },
        { meal: 'dinner', dish: 'Big-batch chili portioned for the week' },
        { meal: 'snack', dish: 'Pre-portioned yogurt and fruit cups' },
      ],
      faqs: [
        { q: 'How long does prepped food last?', a: 'Most Eatwise prep meals keep 3–4 days refrigerated, and several freeze well for longer.' },
        { q: 'How many cook sessions do I need?', a: 'Typically one or two sessions per week cover the plan, depending on your schedule.' },
      ],
    },
    ru: {
      title: 'План для заготовки еды (meal prep)',
      subtitle: 'Планы на неделю под batch-cooking: готовить заранее просто и быстро.',
      intro:
        'Заготовка еды экономит время и держит вас в графике — если рецепты для этого созданы. Eatwise планирует блюда, которые удобно готовить партиями и разогревать, так что пара готовок закрывает всю неделю.',
      benefits: [
        { title: 'Рецепты под партии', text: 'Блюда подобраны так, чтобы готовить большими партиями и разогревать без потери качества.' },
        { title: 'Экономия часов в неделю', text: 'Пара сессий готовки закрывает несколько дней питания.' },
        { title: 'Меньше отходов и трат', text: 'Общие ингредиенты между рецептами снижают стоимость и отходы.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Ленивая овсянка в банках (сразу 5 штук)' },
        { meal: 'lunch', dish: 'Контейнеры с курицей, рисом и запечёнными овощами' },
        { meal: 'dinner', dish: 'Большая партия чили, порционно на неделю' },
        { meal: 'snack', dish: 'Порционные стаканчики с йогуртом и фруктами' },
      ],
      faqs: [
        { q: 'Сколько хранится заготовленная еда?', a: 'Большинство блюд Eatwise для заготовки хранятся 3–4 дня в холодильнике, а многие хорошо замораживаются на дольше.' },
        { q: 'Сколько нужно сессий готовки?', a: 'Обычно одна-две сессии в неделю закрывают план — зависит от вашего графика.' },
      ],
    },
  },
  {
    slug: 'high-protein-vegetarian',
    emoji: '🧀',
    en: {
      title: 'High-Protein Vegetarian Meal Plan',
      subtitle: 'Meat-free weekly plans that still hit serious protein targets.',
      intro:
        'Hitting protein without meat is easy once you know the right combinations. Eatwise builds vegetarian weeks around eggs, dairy, legumes, tofu and grains to reach a high protein goal without any meat.',
      benefits: [
        { title: 'Serious protein, no meat', text: 'Eggs, dairy, soy and legumes combine to hit a high protein target.' },
        { title: 'Muscle-friendly', text: 'Enough protein to support training and recovery on a vegetarian diet.' },
        { title: 'Varied and filling', text: 'Diverse plant and dairy proteins keep meals satisfying.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Greek yogurt bowl with granola and seeds' },
        { meal: 'lunch', dish: 'Lentil and halloumi salad' },
        { meal: 'dinner', dish: 'Tofu and edamame stir-fry with rice' },
        { meal: 'snack', dish: 'Cottage cheese with nuts' },
      ],
      faqs: [
        { q: 'Can vegetarians build muscle?', a: 'Yes. With enough protein from eggs, dairy, soy and legumes, a vegetarian plan fully supports muscle growth.' },
        { q: 'What if I am also vegan?', a: 'Switch to the vegan plan and Eatwise reaches your protein goal with fully plant-based sources.' },
      ],
    },
    ru: {
      title: 'Высокобелковый вегетарианский план питания',
      subtitle: 'Планы без мяса, которые всё равно закрывают серьёзную норму белка.',
      intro:
        'Набрать белок без мяса легко, если знать правильные сочетания. Eatwise собирает вегетарианские недели на яйцах, молочном, бобовых, тофу и злаках, чтобы достичь высокой нормы белка без мяса.',
      benefits: [
        { title: 'Серьёзный белок без мяса', text: 'Яйца, молочное, соя и бобовые вместе закрывают высокую норму белка.' },
        { title: 'Подходит для мышц', text: 'Достаточно белка для тренировок и восстановления на вегетарианстве.' },
        { title: 'Разнообразно и сытно', text: 'Разные растительные и молочные белки держат блюда насыщающими.' },
      ],
      sample: [
        { meal: 'breakfast', dish: 'Боул из греческого йогурта с гранолой и семечками' },
        { meal: 'lunch', dish: 'Салат с чечевицей и халуми' },
        { meal: 'dinner', dish: 'Стир-фрай из тофу и эдамаме с рисом' },
        { meal: 'snack', dish: 'Творог с орехами' },
      ],
      faqs: [
        { q: 'Могут ли вегетарианцы набирать мышцы?', a: 'Да. При достаточном белке из яиц, молочного, сои и бобовых вегетарианский план полностью поддерживает рост мышц.' },
        { q: 'А если я ещё и веган?', a: 'Переключитесь на веганский план — Eatwise закроет норму белка полностью растительными источниками.' },
      ],
    },
  },
];

export const PROGRAMMATIC_SLUGS = SPECS.map((s) => s.slug);

export const PROGRAMMATIC_PLANS: Record<Lang, UseCase[]> = {
  en: SPECS.map((s) => build('en', s)),
  ru: SPECS.map((s) => build('ru', s)),
};

// Lightweight index cards (used on the /meal-plans hub).
export const PROGRAMMATIC_CARDS: Record<Lang, { slug: string; emoji: string; title: string; subtitle: string }[]> = {
  en: PROGRAMMATIC_PLANS.en.map((p) => ({ slug: p.slug, emoji: p.emoji, title: p.title, subtitle: p.subtitle })),
  ru: PROGRAMMATIC_PLANS.ru.map((p) => ({ slug: p.slug, emoji: p.emoji, title: p.title, subtitle: p.subtitle })),
};

export function getProgrammaticPlan(lang: Lang, slug: string): UseCase | undefined {
  return PROGRAMMATIC_PLANS[lang].find((p) => p.slug === slug);
}
