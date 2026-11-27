import { DEFAULT_SITE_URL } from '@/lib/seo/site';

// Server component that injects JSON-LD structured data for the public
// landing page. Helps search engines understand the product and can enable
// rich results (app info, organization, FAQ).
export function StructuredData({ siteUrl }: { siteUrl?: string }) {
  const site = siteUrl || DEFAULT_SITE_URL;

  const organization = {
    '@type': 'Organization',
    '@id': `${site}/#organization`,
    name: 'Eatwise',
    url: site,
    logo: `${site}/og-image.png`,
    sameAs: ['https://t.me/Eatwise4you_bot'],
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${site}/#website`,
    url: site,
    name: 'Eatwise',
    description:
      'AI meal planner that builds personalized weekly meal plans with recipes, macros and a shopping list.',
    publisher: { '@id': `${site}/#organization` },
    inLanguage: ['en', 'ru'],
  };

  const application = {
    '@type': 'SoftwareApplication',
    '@id': `${site}/#app`,
    name: 'Eatwise — AI Meal Planner',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web, iOS, Android (Telegram)',
    description:
      'Eatwise builds personalized weekly meal plans around your goals, diet and allergies — with recipes, calories & macros and an auto-generated grocery list.',
    url: site,
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'Premium Monthly',
        price: '7.99',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'Premium Yearly',
        price: '59.99',
        priceCurrency: 'USD',
      },
    ],
    publisher: { '@id': `${site}/#organization` },
  };

  const faq = {
    '@type': 'FAQPage',
    '@id': `${site}/#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Eatwise?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Eatwise is an AI meal planner that generates a personalized weekly menu based on your goals, diet and allergies, complete with recipes, calories and macros, and an automatic categorized shopping list.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a free plan or trial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Eatwise offers a free plan with 1 meal plan per week and 3 AI swaps per month. Premium unlocks unlimited plans and swaps and comes with a 7-day free trial.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does Premium cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Premium costs $7.99 per month or $59.99 per year (about 37% off). You can cancel anytime.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use Eatwise in Telegram?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Eatwise has a Telegram bot (@Eatwise4you_bot) that mirrors the website and shares the same account and subscription, so you can plan meals right inside Telegram.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Eatwise support different diets and allergies?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can set your diet (regular, vegetarian, vegan, gluten-free, keto) and allergies once, and every generated plan respects them.',
        },
      },
    ],
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [organization, website, application, faq],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
