'use client';

import Link from 'next/link';
import { ArrowRight, Newspaper, Clock } from 'lucide-react';
import { MarketingShell } from '@/components/marketing-shell';
import { useLanguage } from '@/lib/i18n/language-provider';
import { BLOG_POSTS, BLOG_META } from '@/lib/content/blog';

function formatDate(iso: string, lang: 'en' | 'ru') {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function BlogIndexView() {
  const { lang } = useLanguage();
  const meta = BLOG_META[lang];
  const posts = BLOG_POSTS[lang];

  return (
    <MarketingShell>
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5">
            <Newspaper className="h-6 w-6 text-primary" />
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{meta.title}</h1>
          <p className="mt-4 text-muted-foreground text-lg">{meta.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-3xl bg-card p-6 transition-transform hover:-translate-y-1"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <span className="inline-flex self-start items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                {post.category}
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-tight leading-snug group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{post.description}</p>
              <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(post.date, lang)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readMins} {meta.readSuffix}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center rounded-3xl bg-card p-10 md:p-12" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h2 className="text-2xl font-bold tracking-tight">{meta.ctaTitle}</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">{meta.ctaText}</p>
          <Link href="/signup" className="inline-block mt-6">
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
              {meta.ctaButton}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
