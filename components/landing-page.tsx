'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChefHat,
  Sparkles,
  Target,
  RefreshCw,
  ShoppingCart,
  Package,
  Flame,
  Check,
  ArrowRight,
  Send,
  Star,
  Loader2,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LANDING, TELEGRAM_BOT_URL } from '@/lib/landing/content';
import { LEGAL_LABELS } from '@/lib/legal/content';

const FEATURE_ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  target: Target,
  refresh: RefreshCw,
  cart: ShoppingCart,
  pantry: Package,
  macros: Flame,
};

export function LandingPage() {
  const { lang } = useLanguage();
  const c = LANDING[lang];
  const legal = LEGAL_LABELS[lang];
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const year = new Date().getFullYear();

  // Demo generator state
  const [demoGoal, setDemoGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoPlan, setDemoPlan] = useState<any>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const generateDemo = useCallback(async () => {
    setDemoLoading(true);
    setDemoError(null);
    setDemoPlan(null);
    try {
      const res = await fetch('/api/demo-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: demoGoal, lang }),
      });
      if (res.status === 429) {
        setDemoError(c.demo.rateLimited);
        return;
      }
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      setDemoPlan(data.plan);
    } catch {
      setDemoError(c.demo.error);
    } finally {
      setDemoLoading(false);
    }
  }, [demoGoal, lang, c.demo.rateLimited, c.demo.error]);

  const premiumPrice = period === 'monthly' ? c.premium.priceMonthly : c.premium.priceYearly;
  const premiumPeriod = period === 'monthly' ? (lang === 'ru' ? '/мес' : '/mo') : lang === 'ru' ? '/год' : '/yr';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">Eatwise</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">{c.nav.features}</a>
            <a href="#how" className="hover:text-foreground transition-colors">{c.nav.how}</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">{c.nav.pricing}</a>
            <Link href="/meal-plans" className="hover:text-foreground transition-colors">{lang === 'ru' ? 'Планы' : 'Meal plans'}</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">{lang === 'ru' ? 'Блог' : 'Blog'}</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">{lang === 'ru' ? 'Вопросы' : 'FAQ'}</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="sidebar" />
            <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2">
              {c.nav.signIn}
            </Link>
            <Link href="/signup">
              <Button size="sm">{c.nav.getStarted}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-20 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {c.hero.badge}
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              {c.hero.title}{' '}
              <span className="text-primary">{c.hero.highlight}</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
              {c.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  {c.hero.ctaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline">{c.hero.ctaSecondary}</Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{c.hero.trust}</p>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <Image
                src="/landing/hero.png"
                alt="Colorful healthy meal-prep bowls arranged on a table"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="hidden sm:block absolute -bottom-5 -left-5 w-36 h-36 rounded-2xl overflow-hidden bg-muted border-4 border-background" style={{ boxShadow: 'var(--shadow-md)' }}>
              <Image src="/landing/dish.png" alt="Beautifully plated healthy grain bowl" fill sizes="144px" className="object-cover" />
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="max-w-6xl mx-auto px-4 pb-6">
          <div className="grid grid-cols-3 gap-4 rounded-2xl bg-card p-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
            {c.stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{c.featuresTitle}</h2>
          <p className="mt-4 text-muted-foreground text-lg">{c.featuresSubtitle}</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {c.features.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon] ?? Sparkles;
            return (
              <div key={i} className="rounded-2xl bg-card p-6 transition-shadow hover:shadow-lg" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-card/60 border-y border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted order-last md:order-first" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <Image src="/landing/kitchen.png" alt="Person preparing a fresh healthy meal in a bright kitchen" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{c.howTitle}</h2>
            <p className="mt-4 text-muted-foreground text-lg">{c.howSubtitle}</p>
            <ol className="mt-8 space-y-6">
              {c.steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Interactive demo generator */}
      <section id="demo" className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5">
            <Zap className="h-3.5 w-3.5" />
            {c.demo.badge}
          </span>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight">{c.demo.title}</h2>
          <p className="mt-4 text-muted-foreground text-lg">{c.demo.subtitle}</p>
        </div>

        {/* Goal selector */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {(['lose', 'maintain', 'gain'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { setDemoGoal(g); setDemoPlan(null); setDemoError(null); }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                demoGoal === g
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {c.demo.goals[g]}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            className="gap-2 min-w-[220px]"
            onClick={generateDemo}
            disabled={demoLoading}
          >
            {demoLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{c.demo.generating}</>
            ) : (
              <><Sparkles className="h-4 w-4" />{c.demo.generate}</>
            )}
          </Button>
        </div>

        {/* Error */}
        {demoError && (
          <div className="mt-6 text-center">
            <p className="text-sm text-destructive">{demoError}</p>
            {demoError === c.demo.rateLimited && (
              <Link href="/signup" className="inline-block mt-3">
                <Button size="sm" className="gap-2">{c.demo.cta}<ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            )}
          </div>
        )}

        {/* Result card (AI-generated) */}
        {demoPlan && !demoLoading && (
          <div className="mt-10 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl bg-card p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <span className="font-semibold">{demoPlan.dayLabel} · {demoPlan.totalKcal} {lang === 'ru' ? 'ккал' : 'kcal'}</span>
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <ul className="divide-y divide-border/60">
                {demoPlan.meals?.map((m: any, i: number) => (
                  <li key={i} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{m.type}</div>
                        <div className="text-sm font-medium">{m.name}</div>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{m.kcal} {lang === 'ru' ? 'ккал' : 'kcal'}</span>
                    </div>
                    {m.description && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                <span className="text-sm font-semibold">{c.demo.totalLabel}</span>
                <span className="text-sm font-bold text-primary">{demoPlan.totalKcal} {lang === 'ru' ? 'ккал' : 'kcal'}</span>
              </div>
              {demoPlan.macros && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: c.demo.macroLabels.protein, value: demoPlan.macros.protein },
                    { label: c.demo.macroLabels.fat, value: demoPlan.macros.fat },
                    { label: c.demo.macroLabels.carbs, value: demoPlan.macros.carbs },
                  ].map((mac, i) => (
                    <div key={i} className="text-center rounded-xl bg-muted py-3">
                      <div className="text-base font-bold">{mac.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{mac.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {demoPlan.tip && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 px-4 py-3">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-primary">{c.demo.tipLabel}:</span>
                    <span className="text-xs text-muted-foreground ml-1">{demoPlan.tip}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CTA after result */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">{c.demo.resultNote}</p>
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  {c.demo.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Static sample (shown when no demo generated yet) */}
        {!demoPlan && !demoLoading && !demoError && (
          <div className="mt-10 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{c.sample.title}</h3>
              <p className="mt-3 text-muted-foreground">{c.sample.subtitle}</p>
              <p className="mt-3 text-sm text-muted-foreground">{c.sample.note}</p>
            </div>
            <div className="rounded-2xl bg-card p-6 sm:p-8" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <span className="font-semibold">{c.sample.dayLabel}</span>
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <ul className="divide-y divide-border/60">
                {c.sample.meals.map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">{m.type}</div>
                      <div className="text-sm font-medium">{m.name}</div>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{m.kcal}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                <span className="text-sm font-semibold">{c.sample.totalLabel}</span>
                <span className="text-sm font-bold text-primary">{c.sample.totalKcal}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: c.sample.macroLabels.protein, value: c.sample.macros.protein },
                  { label: c.sample.macroLabels.fat, value: c.sample.macros.fat },
                  { label: c.sample.macroLabels.carbs, value: c.sample.macros.carbs },
                ].map((mac, i) => (
                  <div key={i} className="text-center rounded-xl bg-muted py-3">
                    <div className="text-base font-bold">{mac.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{mac.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="bg-card/60 border-y border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{c.testimonialsTitle}</h2>
            <p className="mt-4 text-muted-foreground text-lg">{c.testimonialsSubtitle}</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {c.testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl bg-card p-6 flex flex-col" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{c.pricingTitle}</h2>
          <p className="mt-4 text-muted-foreground text-lg">{c.pricingSubtitle}</p>
        </div>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              {c.monthly}
            </button>
            <button
              type="button"
              onClick={() => setPeriod('yearly')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2 ${period === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              {c.yearly}
              <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">{c.saveBadge}</span>
            </button>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          {/* Free */}
          <div className="rounded-2xl bg-card p-8 flex flex-col" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="font-semibold text-lg">{c.free.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{c.free.tagline}</p>
            <div className="mt-4">
              <span className="text-4xl font-bold">{c.free.priceMonthly}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{c.free.note}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {c.free.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full">{c.free.cta}</Button>
            </Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-2xl bg-card p-8 flex flex-col ring-2 ring-primary" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">
              {c.popularBadge}
            </span>
            <h3 className="font-semibold text-lg">{c.premium.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{c.premium.tagline}</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-bold">{premiumPrice}</span>
              <span className="text-muted-foreground mb-1.5">{premiumPeriod}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{c.premium.note}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {c.premium.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-8">
              <Button className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                {c.premium.cta}
              </Button>
            </Link>
            {c.premium.trialNote && (
              <p className="mt-3 text-xs text-center text-muted-foreground">{c.premium.trialNote}</p>
            )}
          </div>
        </div>
      </section>

      {/* Telegram callout */}
      <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center overflow-hidden">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 text-xs font-semibold px-3 py-1.5">
              <Send className="h-3.5 w-3.5" />
              {c.telegram.badge}
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">{c.telegram.title}</h2>
            <p className="mt-3 text-primary-foreground/85 leading-relaxed">{c.telegram.desc}</p>
            <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-6">
              <Button size="lg" variant="outline" className="gap-2 bg-background text-foreground border-transparent hover:bg-background/90">
                <Send className="h-4 w-4" />
                {c.telegram.cta}
              </Button>
            </a>
          </div>
          <div className="relative aspect-square max-w-xs w-full mx-auto rounded-2xl overflow-hidden bg-white/10">
            <Image src="/landing/groceries.png" alt="Fresh produce arranged for a smart shopping list" fill sizes="(max-width: 768px) 80vw, 320px" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center rounded-3xl bg-card p-10 md:p-16" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{c.finalCta.title}</h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">{c.finalCta.subtitle}</p>
          <Link href="/signup" className="inline-block mt-8">
            <Button size="lg" className="gap-2">
              {c.finalCta.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <ChefHat className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold">Eatwise</span>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-sm order-last md:order-none">{c.footer.tagline}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/meal-plans" className="hover:text-foreground transition-colors">{lang === 'ru' ? 'Планы питания' : 'Meal plans'}</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">{lang === 'ru' ? 'Блог' : 'Blog'}</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">{lang === 'ru' ? 'Вопросы' : 'FAQ'}</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">{legal.terms}</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">{legal.privacy}</Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">{legal.refund}</Link>
          </div>
        </div>
        <div className="border-t border-border/60">
          <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-muted-foreground text-center">
            © {year} Eatwise. {c.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  );
}
