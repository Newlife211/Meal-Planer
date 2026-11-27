'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { MarketingShell } from '@/components/marketing-shell';
import { useLanguage } from '@/lib/i18n/language-provider';
import { BLOG_META, getPost, BLOG_POSTS } from '@/lib/content/blog';

function formatDate(iso: string, lang: 'en' | 'ru') {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function ArticleView({ slug }: { slug: string }) {
  const { lang } = useLanguage();
  const meta = BLOG_META[lang];
  const post = getPost(lang, slug) || getPost('en', slug);
  const related = BLOG_POSTS[lang].filter((p) => p.slug !== slug).slice(0, 2);

  if (!post) {
    return (
      <MarketingShell>
        <section className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">404</p>
          <Link href="/blog" className="mt-4 inline-flex items-center gap-2 text-primary font-medium">
            <ArrowLeft className="h-4 w-4" />
            {meta.backToBlog}
          </Link>
        </section>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <article className="max-w-3xl mx-auto px-4 py-14 md:py-20">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {meta.backToBlog}
        </Link>

        <div className="mt-6">
          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
            {post.category}
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{post.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatDate(post.date, lang)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readMins} {meta.readSuffix}
            </span>
          </div>
        </div>

        <p className="mt-8 text-lg text-foreground/90 leading-relaxed">{post.intro}</p>

        <div className="mt-10 space-y-10">
          {post.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-muted-foreground leading-relaxed">{p}</p>
                ))}
              </div>
              {section.bullets && (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((b, k) => (
                    <li key={k} className="flex gap-3 text-muted-foreground leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-card p-8 md:p-10 text-center" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h2 className="text-2xl font-bold tracking-tight">{meta.ctaTitle}</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">{meta.ctaText}</p>
          <Link href="/signup" className="inline-block mt-6">
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
              {meta.ctaButton}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-bold tracking-tight">{meta.relatedTitle}</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-2xl bg-card p-5 transition-transform hover:-translate-y-1"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <span className="text-xs font-semibold text-primary">{r.category}</span>
                  <p className="mt-2 font-semibold leading-snug group-hover:text-primary transition-colors">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </MarketingShell>
  );
}
