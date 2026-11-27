'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { LANGUAGES, type Lang } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'sidebar' | 'floating';
}

export function LanguageSwitcher({ variant = 'sidebar' }: Props) {
  const { lang, setLang } = useLanguage();

  const buttons = (
    <div className="inline-flex items-center rounded-lg bg-muted p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code as Lang)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
            lang === l.code
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={l.label}
        >
          {l.short}
        </button>
      ))}
    </div>
  );

  if (variant === 'floating') {
    return <div className="absolute top-4 right-4 z-10">{buttons}</div>;
  }

  return (
    <div className="flex items-center gap-2 px-2 mb-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      {buttons}
    </div>
  );
}
