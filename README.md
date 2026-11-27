# 🥗 Eatwise — AI Meal Planner

Интеллектуальный планировщик питания с ИИ-генерацией персональных планов, Telegram-ботом, подписками через Stripe и админ-панелью.

**Сайт:** [geteatwise.com](https://geteatwise.com)

---

## Возможности

- 🤖 ИИ-генерация персонального плана питания (калории, макронутриенты, аллергии, предпочтения)
- 📱 Telegram-бот с полным функционалом (генерация планов, кладовая, список покупок)
- 💳 Подписки через Stripe (бесплатный план + Premium с 7-дневным пробным периодом)
- 🛒 Список покупок, кладовая, история планов
- 🌐 Двуязычный интерфейс (русский / английский) с автоопределением по гео
- 📊 Админ-панель: пользователи, тикеты поддержки, аналитика посещений, статистика подписок
- 🔍 SEO: 21 программная страница планов питания с Recipe JSON-LD
- 📧 Email-уведомления (напоминания, поддержка, онбординг)

---

## Технологии

- **Frontend/Backend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **База данных:** PostgreSQL + Prisma ORM
- **Аутентификация:** NextAuth.js (email + пароль)
- **Платежи:** Stripe (Checkout + Webhooks)
- **ИИ:** Abacus AI API (генерация планов питания)
- **Бот:** Telegram Bot API (вебхук)
- **Аналитика:** Google Analytics + встроенная (PageView tracking)

---

## Быстрый старт

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/Newlife211/Meal-Planer.git
cd Meal-Planer
```

### 2. Установите зависимости

```bash
yarn install
```

### 3. Настройте переменные окружения

```bash
cp .env.example .env
```

Откройте `.env` и заполните значения. Минимально необходимые:

| Переменная | Описание | Где получить |
|---|---|---|
| `DATABASE_URL` | Строка подключения PostgreSQL | Ваш PostgreSQL-сервер |
| `NEXTAUTH_SECRET` | Секрет для сессий (≥32 символа) | `openssl rand -base64 32` |
| `ABACUSAI_API_KEY` | Ключ API для ИИ-генерации | [apps.abacus.ai](https://apps.abacus.ai/chatllm/admin/api-keys) |
| `STRIPE_SECRET_KEY` | Секретный ключ Stripe | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | Публичный ключ Stripe | Там же |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Тот же публичный ключ (для клиента) | Там же |
| `STRIPE_WEBHOOK_SECRET` | Секрет вебхука Stripe | [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота | [@BotFather](https://t.me/BotFather) → `/newbot` |
| `TELEGRAM_WEBHOOK_SECRET` | Секрет для защиты вебхука | `openssl rand -hex 20` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics Measurement ID | [analytics.google.com](https://analytics.google.com/) |

Остальные переменные (`NOTIF_ID_*`, `WEB_APP_ID`) специфичны для платформы Abacus AI. Если вы запускаете проект самостоятельно, их можно оставить пустыми — email-уведомления просто не будут отправляться.

### 4. Инициализируйте базу данных

```bash
yarn prisma generate
yarn prisma db push
yarn prisma db seed
```

### 5. Запустите приложение

```bash
yarn dev
```

Откройте [http://localhost:3000](http://localhost:3000).

---

## Настройка Telegram-бота

1. Создайте бота у [@BotFather](https://t.me/BotFather) (`/newbot`)
2. Скопируйте токен в `TELEGRAM_BOT_TOKEN`
3. Сгенерируйте секрет: `openssl rand -hex 20` → `TELEGRAM_WEBHOOK_SECRET`
4. После деплоя зарегистрируйте вебхук:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://ваш-домен.com/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  -d 'allowed_updates=["message","callback_query"]'
```

5. Проверьте: `curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"`

---

## Настройка Stripe Webhooks

1. Перейдите на [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Добавьте эндпоинт: `https://ваш-домен.com/api/stripe/webhook`
3. Выберите события:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Скопируйте Signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Структура проекта

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Защищённые страницы (план, кладовая, профиль, админ)
│   ├── api/                # API-маршруты
│   ├── blog/               # Статьи блога
│   ├── meal-plans/         # SEO-страницы планов питания
│   └── layout.tsx          # Корневой layout
├── components/             # React-компоненты
├── lib/                    # Утилиты, БД, ИИ, Stripe, i18n, Telegram
│   ├── telegram/           # Telegram-бот (bot.ts, state.ts)
│   ├── i18n/               # Переводы и языковой провайдер
│   ├── content/            # Контент SEO-страниц и рецепты
│   ├── seo/                # SEO-утилиты
│   └── stripe.ts           # Stripe-интеграция
├── prisma/
│   └── schema.prisma       # Схема базы данных
├── public/                 # Статические файлы
└── scripts/                # Скрипты (seed и т.д.)
```

---

## Лицензия

Проприетарный проект. Все права защищены.
