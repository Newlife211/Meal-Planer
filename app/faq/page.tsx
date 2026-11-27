import type { Metadata } from 'next';
import { FaqView } from '@/components/faq-view';
import { getSiteUrl } from '@/lib/seo/site';
import { FAQ_ITEMS } from '@/lib/content/faq';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FAQ — AI Meal Planner Questions Answered',
  description:
    'Answers to common questions about Eatwise: how AI meal planning works, the free plan and Premium, the 7-day free trial, diets & allergies, Telegram, and shopping lists.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  const site = getSiteUrl();
  // Emit FAQPage structured data (English) for rich results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${site}/faq#faq`,
    url: `${site}/faq`,
    mainEntity: FAQ_ITEMS.en.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FaqView />
    </>
  );
}
