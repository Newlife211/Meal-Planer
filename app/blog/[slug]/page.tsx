import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleView } from '@/components/article-view';
import { getSiteUrl } from '@/lib/seo/site';
import { getPost, BLOG_SLUGS } from '@/lib/content/blog';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost('en', params.slug);
  if (!post) {
    return { title: 'Article not found — Eatwise' };
  }
  return {
    title: `${post.title} — Eatwise`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = getPost('en', params.slug);
  if (!post) {
    notFound();
  }

  const site = getSiteUrl();
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${site}/blog/${post.slug}#article`,
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      url: `${site}/blog/${post.slug}`,
      author: { '@type': 'Organization', name: 'Eatwise' },
      publisher: { '@type': 'Organization', name: 'Eatwise' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${site}/blog/${post.slug}` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `${site}/blog/${post.slug}` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleView slug={params.slug} />
    </>
  );
}
