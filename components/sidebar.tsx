'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Home,
  Apple,
  ShoppingCart,
  ClipboardList,
  User,
  LogOut,
  ChefHat,
  Crown,
  ShieldCheck,
  LifeBuoy,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session } = useSession() || {};
  const isAdmin = session?.user?.role === 'admin';

  const navItems = [
    { href: '/meal-plan', label: t.nav.mealPlan, icon: Home },
    { href: '/pantry', label: t.nav.pantry, icon: Apple },
    { href: '/shopping-list', label: t.nav.shoppingList, icon: ShoppingCart },
    { href: '/history', label: t.nav.history, icon: ClipboardList },
    { href: '/profile', label: t.nav.profile, icon: User },
    { href: '/support', label: t.nav.support, icon: LifeBuoy },
  ];

  return (
    <>
      <div className="flex items-center gap-2 mb-8 px-2">
        <ChefHat className="h-7 w-7 text-primary" />
        <span className="text-lg font-bold tracking-tight text-foreground">
          {t.appName}
        </span>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2',
            pathname?.startsWith('/admin')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <ShieldCheck className="h-5 w-5" />
          {t.nav.admin}
        </Link>
      )}
      <Link
        href="/billing"
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors mb-2',
          pathname?.startsWith('/billing')
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        )}
      >
        <Crown className="h-5 w-5" />
        {t.nav.upgrade}
      </Link>
      <div className="mt-4 pt-4 border-t">
        <LanguageSwitcher variant="sidebar" />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t.nav.logout}
        </button>
      </div>
    </>
  );
}
