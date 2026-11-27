'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Flame, Users, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/components/marketing-shell';
import { useLanguage } from '@/lib/i18n/language-provider';
import { getUseCase, SHARED_LABELS } from '@/lib/content/use-cases';
import { getRecipe, RECIPE_LABELS } from '@/lib/content/recipes';

export function UseCaseView({ slug }: { slug: string }) {
  const { lang } = useLanguage();
  const uc = getUseCase(lang, slug) || getUseCase('en', slug);
  const labels = SHARED_LABELS[lang];
  const recipe = getRecipe(lang, slug) || getRecipe('en', slug);
  const rl = RECIPE_LABELS[lang];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!uc) {
    return (
      <MarketingShell>
        <section className="max-w-3xl mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">404</p>
          <Link href="/meal-plans" className="mt-4 inline-flex items-center gap-2 text-primary font-medium">
            <ArrowLeft className="h-4 w-4" />
            {labels.backToPlans}
          </Link>
        </section>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-14 md:pt-20">
        <Link href="/meal-plans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {labels.backToPlans}
        </Link>
        <div className="mt-6 text-center">
          <span className="text-5xl" aria-hidden>{uc.emoji}</span>
          <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{uc.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{uc.subtitle}</p>
          <Link href="/signup" className="inline-block mt-7">
            <Button size="lg" className="gap-2">
              {labels.ctaButton}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <p className="mt-10 text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">{uc.intro}</p>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">{uc.benefitsTitle}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {uc.benefits.map((b, i) => (
            <div key={i} className="rounded-3xl bg-card p-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-4">
                <Check className="h-5 w-5 text-primary" />
              </span>
              <h3 className="font-bold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works + sample day */}
      <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-card p-8" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h2 className="text-2xl font-bold tracking-tight">{uc.howTitle}</h2>
            <ol className="mt-6 space-y-5">
              {uc.how.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground leading-relaxed pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl bg-card p-8" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h2 className="text-2xl font-bold tracking-tight">{uc.sampleTitle}</h2>
            <div className="mt-6 space-y-4">
              {uc.sample.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                  <span className="text-sm font-semibold text-primary shrink-0 w-24">
                    {labels.sampleMeals[s.meal as keyof typeof labels.sampleMeals]}
                  </span>
                  <span className="text-sm text-muted-foreground text-right flex-1">{s.dish}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured recipe */}
      {recipe && (
        <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-20">
          <div className="rounded-3xl bg-card p-8 md:p-10" style={{ boxShadow: 'var(--shadow-md)' }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <UtensilsCrossed className="h-4 w-4" />
              {rl.badge}
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">{recipe.name}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed max-w-3xl">{recipe.description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">{rl.prep}:</span> {recipe.prepMin} {rl.minutes}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                <Flame className="h-4 w-4 text-primary" />
                <span className="font-semibold">{rl.cook}:</span> {recipe.cookMin} {rl.minutes}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold">{rl.serves}:</span> {recipe.servings}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-primary/5 p-3 text-center">
                <p className="text-lg font-bold">{recipe.kcal}</p>
                <p className="text-xs text-muted-foreground">{rl.kcal}</p>
              </div>
              <div className="rounded-xl bg-primary/5 p-3 text-center">
                <p className="text-lg font-bold">{recipe.protein} g</p>
                <p className="text-xs text-muted-foreground">{rl.protein}</p>
              </div>
              <div className="rounded-xl bg-primary/5 p-3 text-center">
                <p className="text-lg font-bold">{recipe.carbs} g</p>
                <p className="text-xs text-muted-foreground">{rl.carbs}</p>
              </div>
              <div className="rounded-xl bg-primary/5 p-3 text-center">
                <p className="text-lg font-bold">{recipe.fat} g</p>
                <p className="text-xs text-muted-foreground">{rl.fat}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{rl.perServing}</p>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="font-bold">{rl.ingredients}</h3>
                <ul className="mt-4 space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold">{rl.steps}</h3>
                <ol className="mt-4 space-y-4">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-16 md:pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">{uc.faqTitle}</h2>
        <div className="mt-8 space-y-3">
          {uc.faqs.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="rounded-2xl bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-4 hover:bg-muted/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold">{f.q}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 -mt-1">
                    <p className="text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center rounded-3xl bg-card p-10 md:p-14" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{uc.ctaTitle}</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">{uc.ctaText}</p>
          <Link href="/signup" className="inline-block mt-7">
            <Button size="lg" className="gap-2">
              {labels.ctaButton}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
