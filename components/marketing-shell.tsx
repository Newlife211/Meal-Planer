'use client';

import Link from 'next/link';
import { ChefHat } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { LEGAL_LABELS } from '@/lib/legal/content';

// Shared marketing header + footer used across content SEO pages
// (blog, FAQ, use-case landing pages) so they match the main landing page.
export function MarketingShell({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const legal = LEGAL_LABELS[lang];
  const year = new Date().getFullYear();

  const nav = {
    blog: lang === 'ru' ? 'Блог' : 'Blog',
    faq: lang === 'ru' ? 'Вопросы' : 'FAQ',
    mealPlans: lang === 'ru' ? 'Планы питания' : 'Meal plans',
    signIn: lang === 'ru' ? 'Войти' : 'Sign in',
    getStarted: lang === 'ru' ? 'Начать' : 'Get started',
    tagline:
      lang === 'ru'
        ? 'Умное планирование питания на базе ИИ — питайтесь умно, живите лучше.'
        : 'Smart AI-powered meal planning — eat wise, live better.',
    rights: lang === 'ru' ? 'Все права защищены.' : 'All rights reserved.',
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">Eatwise</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="/meal-plans" className="hover:text-foreground transition-colors">{nav.mealPlans}</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">{nav.blog}</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">{nav.faq}</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="sidebar" />
            <Link href="/login" className="hidden sm:inline text-sm font-medium text-foreground hover:text-primary transition-colors px-2">
              {nav.signIn}
            </Link>
            <Link href="/signup">
              <Button size="sm">{nav.getStarted}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <ChefHat className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold">Eatwise</span>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-sm order-last md:order-none">{nav.tagline}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/meal-plans" className="hover:text-foreground transition-colors">{nav.mealPlans}</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">{nav.blog}</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">{nav.faq}</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">{legal.terms}</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">{legal.privacy}</Link>
          </div>
        </div>
        <div className="border-t border-border/60">
          <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-muted-foreground text-center">
            © {year} Eatwise. {nav.rights}
          </p>
        </div>
      </footer>
    </div>
  );
}
