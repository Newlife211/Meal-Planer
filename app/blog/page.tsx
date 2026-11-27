import type { Metadata } from 'next';
import { BlogIndexView } from '@/components/blog-index-view';
import { getSiteUrl } from '@/lib/seo/site';
import { BLOG_POSTS } from '@/lib/content/blog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog — Meal Planning & Nutrition Guides',
  description:
    'Practical, science-backed guides on meal planning, meal prep, weight loss and nutrition from the Eatwise team.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  const site = getSiteUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${site}/blog#blog`,
    url: `${site}/blog`,
    name: 'Eatwise Blog',
    description:
      'Practical, science-backed guides on meal planning, meal prep, weight loss and nutrition.',
    blogPost: BLOG_POSTS.en.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `${site}/blog/${p.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogIndexView />
    </>
  );
}
