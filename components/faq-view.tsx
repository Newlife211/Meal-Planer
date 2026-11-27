'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/components/marketing-shell';
import { useLanguage } from '@/lib/i18n/language-provider';
import { FAQ_ITEMS, FAQ_META } from '@/lib/content/faq';

export function FaqView() {
  const { lang } = useLanguage();
  const meta = FAQ_META[lang];
  const items = FAQ_ITEMS[lang];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <MarketingShell>
      <section className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5">
            <HelpCircle className="h-6 w-6 text-primary" />
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{meta.title}</h1>
          <p className="mt-4 text-muted-foreground text-lg">{meta.subtitle}</p>
        </div>

        <div className="mt-12 space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="rounded-2xl bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-4 hover:bg-muted/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold">{item.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 -mt-1">
                    <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center rounded-3xl bg-card p-10 md:p-12" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h2 className="text-2xl font-bold tracking-tight">{meta.ctaTitle}</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">{meta.ctaText}</p>
          <Link href="/signup" className="inline-block mt-6">
            <Button size="lg" className="gap-2">
              {meta.ctaButton}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
