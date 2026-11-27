// Bilingual FAQ content for Eatwise. Rendered by components/faq-view.tsx and
// emitted as FAQPage JSON-LD for rich results. Keep answers plain-text so they
// can be reused verbatim in structured data.

export type FaqItem = { q: string; a: string };

export const FAQ_META = {
  en: {
    title: 'Frequently asked questions',
    subtitle: 'Everything about how Eatwise plans your meals, pricing and the free trial.',
    ctaTitle: 'Still have questions?',
    ctaText: 'Start free and see how Eatwise plans your week in seconds.',
    ctaButton: 'Start free',
  },
  ru: {
    title: 'Частые вопросы',
    subtitle: 'Всё о том, как Eatwise планирует питание, о тарифах и бесплатном триале.',
    ctaTitle: 'Остались вопросы?',
    ctaText: 'Начните бесплатно и посмотрите, как Eatwise составляет план на неделю за секунды.',
    ctaButton: 'Начать бесплатно',
  },
} as const;

export const FAQ_ITEMS: Record<'en' | 'ru', FaqItem[]> = {
  en: [
    {
      q: 'What is Eatwise?',
      a: 'Eatwise is an AI meal planner that builds a personalized weekly menu around your goal, diet and allergies. Every plan comes with recipes, calorie and macro breakdowns, and an automatically generated, categorized shopping list.',
    },
    {
      q: 'How does the AI meal planning work?',
      a: 'You complete a short onboarding — your goal (lose, maintain or gain weight), diet type, allergies, daily calories and preferences. Eatwise then generates a balanced 7-day plan in seconds, and you can swap any meal or ingredient you don’t like for a smart AI alternative.',
    },
    {
      q: 'Is there a free plan?',
      a: 'Yes. The Free plan lets you generate one meal plan per week, make 3 AI swaps per month, and use the pantry, shopping list and nutrition tools. No credit card is required to start.',
    },
    {
      q: 'What do I get with Premium?',
      a: 'Premium unlocks unlimited meal plans, unlimited AI meal and ingredient swaps, full plan history, priority AI generation and full Telegram bot access. It costs $7.99 per month or $59.99 per year (about 37% cheaper).',
    },
    {
      q: 'How does the 7-day free trial work?',
      a: 'New Premium subscriptions start with a 7-day free trial. You get full Premium access immediately and are not charged until the trial ends. You can cancel anytime during the trial and you won’t be billed.',
    },
    {
      q: 'Can I cancel my subscription anytime?',
      a: 'Yes. You can cancel at any time from the Billing page or through the Telegram bot. You keep Premium access until the end of the period you already paid for, and you won’t be charged again.',
    },
    {
      q: 'Does Eatwise support allergies and diets like keto or vegetarian?',
      a: 'Yes. You can set allergies and intolerances plus a diet type — including keto, vegetarian, vegan, high-protein and balanced. Every generated plan and swap respects those settings.',
    },
    {
      q: 'Can I use Eatwise in Telegram?',
      a: 'Yes. Our Telegram bot @Eatwise4you_bot lets you generate plans, swap meals and manage your subscription on the go. Your account, plans and subscription stay in sync between the website and Telegram.',
    },
    {
      q: 'How is the shopping list created?',
      a: 'Every meal plan is automatically turned into an organized grocery list, grouped by category and combining duplicate ingredients. If you track your pantry, items you already have are skipped.',
    },
    {
      q: 'Which languages does Eatwise support?',
      a: 'Eatwise is fully available in English and Russian across the website and the Telegram bot, and you can switch languages at any time.',
    },
  ],
  ru: [
    {
      q: 'Что такое Eatwise?',
      a: 'Eatwise — это планировщик питания на базе ИИ, который составляет персональное меню на неделю с учётом вашей цели, диеты и аллергий. К каждому плану прилагаются рецепты, расчёт КБЖУ и автоматический список покупок по категориям.',
    },
    {
      q: 'Как работает планирование на ИИ?',
      a: 'Вы проходите короткую анкету — цель (похудеть, поддержать или набрать вес), тип диеты, аллергии, суточные калории и предпочтения. Eatwise за секунды создаёт сбалансированный план на 7 дней, а любое блюдо или ингредиент можно заменить умной альтернативой от ИИ.',
    },
    {
      q: 'Есть ли бесплатный тариф?',
      a: 'Да. На бесплатном тарифе можно создавать один план питания в неделю, делать 3 замены ИИ в месяц и пользоваться запасами, списком покупок и расчётом КБЖУ. Привязывать карту для старта не нужно.',
    },
    {
      q: 'Что даёт Premium?',
      a: 'Premium открывает безлимитные планы питания, безлимитные замены блюд и ингредиентов, полную историю планов, приоритетную генерацию и полный доступ к Telegram-боту. Стоимость — $7.99 в месяц или $59.99 в год (примерно на 37% выгоднее).',
    },
    {
      q: 'Как работает 7-дневный бесплатный триал?',
      a: 'Новые подписки Premium начинаются с 7-дневного бесплатного периода. Вы сразу получаете полный доступ к Premium, а списание происходит только после окончания триала. Отменить можно в любой момент до его окончания — тогда деньги не спишутся.',
    },
    {
      q: 'Можно ли отменить подписку в любое время?',
      a: 'Да. Отменить подписку можно в любой момент на странице «Оплата» или через Telegram-бот. Доступ к Premium сохраняется до конца оплаченного периода, и повторного списания не будет.',
    },
    {
      q: 'Поддерживаются ли аллергии и диеты вроде кето или вегетарианской?',
      a: 'Да. Можно указать аллергии и непереносимости, а также тип диеты — кето, вегетарианская, веганская, высокобелковая и сбалансированная. Каждый план и замена учитывают эти настройки.',
    },
    {
      q: 'Можно ли пользоваться Eatwise в Telegram?',
      a: 'Да. Наш Telegram-бот @Eatwise4you_bot позволяет создавать планы, менять блюда и управлять подпиской на ходу. Аккаунт, планы и подписка синхронизированы между сайтом и Telegram.',
    },
    {
      q: 'Как создаётся список покупок?',
      a: 'Каждый план питания автоматически превращается в удобный список покупок по категориям, с объединением одинаковых ингредиентов. Если вы ведёте учёт запасов, то то, что уже есть дома, в список не попадает.',
    },
    {
      q: 'На каких языках работает Eatwise?',
      a: 'Eatwise полностью доступен на русском и английском языках — и на сайте, и в Telegram-боте, и переключать язык можно в любой момент.',
    },
  ],
};
