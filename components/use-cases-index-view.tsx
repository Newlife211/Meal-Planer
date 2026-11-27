'use client';

import Link from 'next/link';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';
import { MarketingShell } from '@/components/marketing-shell';
import { useLanguage } from '@/lib/i18n/language-provider';
import { USE_CASES, USE_CASE_INDEX_META } from '@/lib/content/use-cases';
import { PROGRAMMATIC_CARDS } from '@/lib/content/programmatic';

export function UseCasesIndexView() {
  const { lang } = useLanguage();
  const meta = USE_CASE_INDEX_META[lang];
  const cases = USE_CASES[lang];
  const moreCards = PROGRAMMATIC_CARDS[lang];

  return (
    <MarketingShell>
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{meta.title}</h1>
          <p className="mt-4 text-muted-foreground text-lg">{meta.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {cases.map((c) => (
            <Link
              key={c.slug}
              href={`/meal-plans/${c.slug}`}
              className="group flex items-start gap-5 rounded-3xl bg-card p-6 transition-transform hover:-translate-y-1"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <span className="text-3xl leading-none" aria-hidden>{c.emoji}</span>
              <div className="flex-1">
                <h2 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{c.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {meta.cardCta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{meta.moreTitle}</h2>
          <p className="mt-3 text-muted-foreground">{meta.moreSubtitle}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moreCards.map((c) => (
            <Link
              key={c.slug}
              href={`/meal-plans/${c.slug}`}
              className="group flex items-start gap-4 rounded-2xl bg-card p-5 transition-transform hover:-translate-y-1"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <span className="text-2xl leading-none" aria-hidden>{c.emoji}</span>
              <div className="flex-1">
                <h3 className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">{c.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.subtitle}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {meta.cardCta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
