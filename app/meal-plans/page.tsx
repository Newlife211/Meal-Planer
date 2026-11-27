import type { Metadata } from 'next';
import { UseCasesIndexView } from '@/components/use-cases-index-view';
import { getSiteUrl } from '@/lib/seo/site';
import { USE_CASES } from '@/lib/content/use-cases';
import { PROGRAMMATIC_CARDS } from '@/lib/content/programmatic';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Meal Plans — Keto, Vegetarian, Weight Loss & High-Protein',
  description:
    'Personalized AI meal plans for every goal: keto, vegetarian, weight loss and high-protein. Recipes, macros and a shopping list, generated in seconds.',
  alternates: { canonical: '/meal-plans' },
};

export default function MealPlansPage() {
  const site = getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${site}/meal-plans#list`,
    name: 'AI meal plans by goal',
    itemListElement: [
      ...USE_CASES.en.map((u) => ({ name: u.title, slug: u.slug })),
      ...PROGRAMMATIC_CARDS.en.map((c) => ({ name: c.title, slug: c.slug })),
    ].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: `${site}/meal-plans/${item.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UseCasesIndexView />
    </>
  );
}
