// Bilingual blog content for content SEO. Each post exists in both English and
// Russian under the SAME slug so URLs stay stable across languages.

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  date: string; // ISO date, publication date
  readMins: number;
  category: string;
  title: string;
  description: string;
  intro: string;
  sections: ArticleSection[];
};

export const BLOG_META = {
  en: {
    title: 'Eatwise Blog',
    subtitle:
      'Practical, science-backed guides on meal planning, nutrition and building habits that last.',
    readSuffix: 'min read',
    backToBlog: 'Back to blog',
    ctaTitle: 'Let AI build your plan',
    ctaText:
      'Stop guessing what to eat. Get a personalized weekly meal plan with recipes and a shopping list in seconds.',
    ctaButton: 'Start free',
    relatedTitle: 'Keep reading',
  },
  ru: {
    title: 'Блог Eatwise',
    subtitle:
      'Практичные и научно обоснованные гайды о планировании питания, нутрициологии и полезных привычках.',
    readSuffix: 'мин чтения',
    backToBlog: 'Назад к блогу',
    ctaTitle: 'Доверьте план ИИ',
    ctaText:
      'Перестаньте гадать, что приготовить. Получите персональный план питания на неделю с рецептами и списком покупок за секунды.',
    ctaButton: 'Начать бесплатно',
    relatedTitle: 'Читать дальше',
  },
} as const;

export const BLOG_POSTS: Record<'en' | 'ru', BlogPost[]> = {
  en: [
    {
      slug: 'weekly-meal-plan',
      date: '2025-11-18',
      readMins: 7,
      category: 'Meal planning',
      title: 'How to build a weekly meal plan that actually works',
      description:
        'A simple, repeatable framework for planning a full week of meals — one that saves money, cuts food waste and removes the daily "what should I eat?" decision.',
      intro:
        'Most meal plans fail not because the recipes are bad, but because the plan ignores real life. A plan that works fits your schedule, your budget and the way you actually shop. Here is a framework you can reuse every single week.',
      sections: [
        {
          heading: 'Start with your week, not with recipes',
          paragraphs: [
            'Before you pick a single dish, look at your calendar. How many dinners will you cook at home? Which nights are rushed? Which day works for a bigger cook-up? Planning around your real schedule is the difference between a plan you follow and one you abandon by Wednesday.',
            'Decide how many meals you actually need to plan. For most people that is 4–5 dinners, a couple of lunches and a repeatable breakfast — not 21 unique meals.',
          ],
        },
        {
          heading: 'Set your targets first',
          paragraphs: [
            'A plan without a target is just a list. Decide what the week should do for you: lose fat, hit a protein goal, eat more vegetables, or simply spend less. Your target shapes every choice that follows.',
          ],
          bullets: [
            'Calories: a rough daily range keeps portions honest.',
            'Protein: aim for a source in every meal to stay full and preserve muscle.',
            'Vegetables: plan at least two at dinner so they are not an afterthought.',
          ],
        },
        {
          heading: 'Build around a few flexible bases',
          paragraphs: [
            'Cooking becomes effortless when you reuse ingredients across meals. Roast a tray of vegetables, cook a pot of grains and prep a protein — then mix and match them into different bowls, wraps and salads through the week.',
            'This "components, not recipes" approach means one shopping trip covers many meals, and leftovers become tomorrow\'s lunch instead of waste.',
          ],
        },
        {
          heading: 'Write the shopping list from the plan',
          paragraphs: [
            'Once the week is mapped, turn it into a single categorized shopping list — produce, protein, pantry, dairy. Shopping from a plan (instead of wandering the aisles) is the fastest way to cut both spending and impulse buys.',
            'This is exactly where an AI planner saves hours: it generates the plan and the consolidated shopping list together, so quantities line up and nothing is bought twice.',
          ],
        },
        {
          heading: 'Leave room to be human',
          paragraphs: [
            'Plan one flexible night for eating out, leftovers or a simple fallback meal. A plan with slack survives a busy week; a rigid plan breaks at the first surprise. Consistency over months beats perfection for a few days.',
          ],
        },
      ],
    },
    {
      slug: 'meal-prep-weight-loss',
      date: '2025-11-25',
      readMins: 8,
      category: 'Weight loss',
      title: 'Meal prep for weight loss: a beginner-friendly guide',
      description:
        'How to use batch cooking and smart portions to lose fat without counting every calorie or eating bland food all week.',
      intro:
        'Meal prep is the single highest-leverage habit for weight loss, because it removes the moment of weakness — the hungry, tired evening when takeout wins. When healthy food is already made, the easy choice becomes the good choice.',
      sections: [
        {
          heading: 'Why prep beats willpower',
          paragraphs: [
            'Weight loss comes down to a sustained, moderate calorie deficit. The hard part is not knowing that — it is doing it consistently when life gets busy. Prepping removes dozens of daily decisions, and fewer decisions mean fewer chances to go off track.',
          ],
        },
        {
          heading: 'The plate formula',
          paragraphs: [
            'You do not need to weigh everything. A simple, repeatable plate keeps portions in check:',
          ],
          bullets: [
            'Half the container: non-starchy vegetables (high volume, low calories, keeps you full).',
            'A quarter: lean protein (chicken, fish, tofu, legumes, lean beef).',
            'A quarter: smart carbs (rice, potatoes, grains) sized to your activity.',
            'A thumb of fats: olive oil, avocado, nuts — for flavor and satiety.',
          ],
        },
        {
          heading: 'Prep in components, assemble on the day',
          paragraphs: [
            'Instead of five identical boxes you will resent by Thursday, cook components separately — two proteins, two vegetables, one or two carbs — and combine them differently each day. Variety keeps you from quitting.',
            'Cook once, eat three or four times. Roasting, sheet-pan meals and one-pot grains give the best return on your kitchen time.',
          ],
        },
        {
          heading: 'Protein is your appetite lever',
          paragraphs: [
            'Protein is the most filling macronutrient and protects muscle while you lose fat. Anchoring every meal and snack around protein is the simplest way to feel satisfied on fewer calories — no extreme restriction required.',
          ],
        },
        {
          heading: 'Make the healthy option the easy option',
          paragraphs: [
            'Keep prepped food at eye level, portion snacks in advance, and have a 10-minute fallback meal ready for chaotic days. A personalized plan that respects your calorie target and your tastes turns all of this into a routine you can keep for months, not days.',
          ],
        },
      ],
    },
    {
      slug: 'understanding-macros',
      date: '2025-12-02',
      readMins: 6,
      category: 'Nutrition',
      title: 'Understanding macros: protein, carbs and fats explained',
      description:
        'A clear, no-jargon guide to macronutrients — what they do, how much you need, and how to use them without obsessive tracking.',
      intro:
        '"Macros" simply means the three nutrients that supply energy: protein, carbohydrates and fat. Understanding them helps you build balanced meals — without turning every plate into a spreadsheet.',
      sections: [
        {
          heading: 'Protein: build and repair',
          paragraphs: [
            'Protein builds and maintains muscle, supports your immune system and keeps you full. It is the macro most people under-eat.',
            'A practical target for active adults is roughly 1.6–2.2 g per kilogram of body weight per day. Good sources include chicken, fish, eggs, dairy, tofu, tempeh and legumes.',
          ],
        },
        {
          heading: 'Carbohydrates: your main fuel',
          paragraphs: [
            'Carbs are your body\'s preferred energy source, especially for the brain and for training. They are not the enemy — quality and quantity are what matter.',
            'Favor minimally processed carbs — whole grains, potatoes, fruit, legumes — which come packaged with fiber and micronutrients and keep energy steady.',
          ],
        },
        {
          heading: 'Fats: hormones and absorption',
          paragraphs: [
            'Dietary fat supports hormone production and helps you absorb fat-soluble vitamins. It is calorie-dense, so portion awareness matters, but it is essential — very low-fat diets are rarely sustainable or healthy.',
            'Prioritize unsaturated fats from olive oil, nuts, seeds, avocado and fish.',
          ],
        },
        {
          heading: 'How much of each?',
          paragraphs: [
            'A balanced starting split for many people is roughly 30% protein, 40% carbohydrate and 30% fat — but the best ratio is the one that fits your goal, your training and your preferences.',
            'You do not have to track forever. Use macros to learn what a balanced plate looks like, then let that intuition guide you. An AI planner can hit your targets automatically, so you get the benefits of macro-balanced meals without logging every bite.',
          ],
        },
      ],
    },
  ],
  ru: [
    {
      slug: 'weekly-meal-plan',
      date: '2025-11-18',
      readMins: 7,
      category: 'Планирование',
      title: 'Как составить план питания на неделю, который действительно работает',
      description:
        'Простой и повторяемый подход к планированию питания на всю неделю — экономит деньги, сокращает пищевые отходы и снимает ежедневный вопрос «что бы поесть?».',
      intro:
        'Большинство планов питания проваливаются не из-за плохих рецептов, а потому что не учитывают реальную жизнь. Работающий план подстроен под ваш график, бюджет и то, как вы реально ходите за покупками. Вот система, которую можно использовать каждую неделю.',
      sections: [
        {
          heading: 'Начните с недели, а не с рецептов',
          paragraphs: [
            'Прежде чем выбрать хоть одно блюдо, посмотрите в календарь. Сколько ужинов вы приготовите дома? Какие вечера будут загруженными? В какой день удобно приготовить побольше впрок? Планирование под реальный график — это разница между планом, которому вы следуете, и тем, что заброшен уже в среду.',
            'Решите, сколько приёмов пищи вам реально нужно спланировать. Для большинства это 4–5 ужинов, пара обедов и повторяющийся завтрак — а не 21 уникальное блюдо.',
          ],
        },
        {
          heading: 'Сначала определите цель',
          paragraphs: [
            'План без цели — это просто список. Решите, что неделя должна вам дать: снизить вес, набрать норму белка, есть больше овощей или просто тратить меньше. Цель определяет все последующие решения.',
          ],
          bullets: [
            'Калории: примерный дневной диапазон удержит порции в рамках.',
            'Белок: источник белка в каждом приёме пищи держит сытость и сохраняет мышцы.',
            'Овощи: планируйте минимум два на ужин, чтобы они не были на «потом».',
          ],
        },
        {
          heading: 'Стройте вокруг нескольких гибких основ',
          paragraphs: [
            'Готовка становится лёгкой, когда вы переиспользуете ингредиенты между блюдами. Запеките противень овощей, сварите крупу и приготовьте белок — а затем комбинируйте их в разные боулы, роллы и салаты в течение недели.',
            'Подход «компоненты, а не рецепты» означает, что один поход в магазин закрывает много приёмов пищи, а остатки становятся завтрашним обедом, а не отходами.',
          ],
        },
        {
          heading: 'Составьте список покупок из плана',
          paragraphs: [
            'Когда неделя расписана, превратите её в один список покупок по категориям — овощи, белок, бакалея, молочное. Покупки по плану (а не блуждание по рядам) — самый быстрый способ снизить и траты, и импульсивные покупки.',
            'Именно здесь ИИ-планировщик экономит часы: он генерирует план и сводный список покупок вместе, так что количества сходятся и ничего не покупается дважды.',
          ],
        },
        {
          heading: 'Оставьте место на человеческий фактор',
          paragraphs: [
            'Запланируйте один гибкий вечер — для кафе, остатков или простого запасного ужина. План с запасом переживёт загруженную неделю; жёсткий план ломается на первом же сюрпризе. Постоянство на протяжении месяцев важнее идеальности на пару дней.',
          ],
        },
      ],
    },
    {
      slug: 'meal-prep-weight-loss',
      date: '2025-11-25',
      readMins: 8,
      category: 'Снижение веса',
      title: 'Мил-преп для снижения веса: гайд для начинающих',
      description:
        'Как использовать заготовки и разумные порции, чтобы худеть без подсчёта каждой калории и без пресной еды всю неделю.',
      intro:
        'Заготовка еды (мил-преп) — самая эффективная привычка для снижения веса, потому что она убирает момент слабости: голодный усталый вечер, когда побеждает доставка. Когда здоровая еда уже готова, лёгкий выбор становится правильным выбором.',
      sections: [
        {
          heading: 'Почему заготовки сильнее силы воли',
          paragraphs: [
            'Снижение веса сводится к устойчивому умеренному дефициту калорий. Сложность не в том, чтобы это знать, а в том, чтобы делать это стабильно, когда жизнь загружена. Заготовки убирают десятки ежедневных решений, а меньше решений — меньше шансов сорваться.',
          ],
        },
        {
          heading: 'Формула тарелки',
          paragraphs: [
            'Не нужно всё взвешивать. Простая повторяемая тарелка держит порции под контролем:',
          ],
          bullets: [
            'Половина контейнера: некрахмалистые овощи (большой объём, мало калорий, дают сытость).',
            'Четверть: постный белок (курица, рыба, тофу, бобовые, нежирная говядина).',
            'Четверть: разумные углеводы (рис, картофель, крупы) под вашу активность.',
            'Немного жиров: оливковое масло, авокадо, орехи — для вкуса и сытости.',
          ],
        },
        {
          heading: 'Готовьте компонентами, собирайте в день еды',
          paragraphs: [
            'Вместо пяти одинаковых контейнеров, которые надоедят к четвергу, готовьте компоненты отдельно — два белка, два овоща, один-два гарнира — и каждый день комбинируйте по-новому. Разнообразие не даёт бросить.',
            'Готовьте один раз — ешьте три-четыре. Запекание, блюда «на противне» и крупы «в одной кастрюле» дают лучшую отдачу от времени на кухне.',
          ],
        },
        {
          heading: 'Белок — ваш рычаг аппетита',
          paragraphs: [
            'Белок — самый насыщающий макронутриент, он защищает мышцы, пока вы теряете жир. Построение каждого приёма пищи и перекуса вокруг белка — самый простой способ чувствовать сытость на меньшем количестве калорий, без жёстких ограничений.',
          ],
        },
        {
          heading: 'Сделайте здоровый выбор лёгким выбором',
          paragraphs: [
            'Держите готовую еду на уровне глаз, расфасуйте перекусы заранее и имейте запасной приём пищи на 10 минут для хаотичных дней. Персональный план, учитывающий вашу норму калорий и вкусы, превращает всё это в рутину, которую можно держать месяцами, а не днями.',
          ],
        },
      ],
    },
    {
      slug: 'understanding-macros',
      date: '2025-12-02',
      readMins: 6,
      category: 'Нутрициология',
      title: 'Разбираемся в КБЖУ: белки, жиры и углеводы простыми словами',
      description:
        'Понятный гайд без жаргона о макронутриентах — что они делают, сколько нужно и как использовать их без навязчивого подсчёта.',
      intro:
        '«Макросы» — это просто три нутриента, которые дают энергию: белки, углеводы и жиры. Понимание их помогает собирать сбалансированные блюда — не превращая каждую тарелку в таблицу.',
      sections: [
        {
          heading: 'Белок: строительство и восстановление',
          paragraphs: [
            'Белок строит и поддерживает мышцы, помогает иммунитету и даёт сытость. Это тот макрос, которого большинство людей недоедает.',
            'Практичный ориентир для активных взрослых — примерно 1,6–2,2 г на килограмм массы тела в день. Хорошие источники: курица, рыба, яйца, молочное, тофу, темпе и бобовые.',
          ],
        },
        {
          heading: 'Углеводы: основное топливо',
          paragraphs: [
            'Углеводы — предпочтительный источник энергии для организма, особенно для мозга и тренировок. Они не враг — важны качество и количество.',
            'Отдавайте предпочтение минимально обработанным углеводам — цельным крупам, картофелю, фруктам, бобовым — в них есть клетчатка и микронутриенты, и они дают ровную энергию.',
          ],
        },
        {
          heading: 'Жиры: гормоны и усвоение',
          paragraphs: [
            'Пищевой жир поддерживает выработку гормонов и помогает усваивать жирорастворимые витамины. Он калориен, поэтому важна осознанность порций, но он необходим — диеты с очень низким содержанием жира редко устойчивы и полезны.',
            'Отдавайте приоритет ненасыщенным жирам: оливковое масло, орехи, семена, авокадо и рыба.',
          ],
        },
        {
          heading: 'Сколько чего?',
          paragraphs: [
            'Сбалансированное стартовое распределение для многих — примерно 30% белка, 40% углеводов и 30% жиров, но лучшее соотношение то, что подходит вашей цели, тренировкам и предпочтениям.',
            'Считать вечно не нужно. Используйте КБЖУ, чтобы понять, как выглядит сбалансированная тарелка, а затем доверьтесь этой интуиции. ИИ-планировщик может попадать в ваши цели автоматически, так что вы получаете пользу сбалансированных блюд без учёта каждого кусочка.',
          ],
        },
      ],
    },
  ],
};

export const BLOG_SLUGS = BLOG_POSTS.en.map((p) => p.slug);

export function getPost(lang: 'en' | 'ru', slug: string): BlogPost | undefined {
  return BLOG_POSTS[lang].find((p) => p.slug === slug);
}
