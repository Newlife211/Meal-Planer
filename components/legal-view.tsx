'use client';

import Link from 'next/link';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LEGAL, LEGAL_LABELS, type LegalKey, type LegalBody } from '@/lib/legal/content';

function renderBody(item: LegalBody, idx: number) {
  if (Array.isArray(item)) {
    return (
      <ul key={idx} className="list-disc pl-6 space-y-1.5 text-muted-foreground">
        {item.map((li, j) => (
          <li key={j}>{li}</li>
        ))}
      </ul>
    );
  }
  return (
    <p key={idx} className="text-muted-foreground leading-relaxed">
      {item}
    </p>
  );
}

export function LegalView({ docKey }: { docKey: LegalKey }) {
  const { lang } = useLanguage();
  const doc = LEGAL[lang][docKey];
  const labels = LEGAL_LABELS[lang];
  const updatedLabel = lang === 'ru' ? 'Обновлено:' : 'Last updated:';
  const backLabel = lang === 'ru' ? 'Назад к входу' : 'Back to sign in';
  const otherLabel = lang === 'ru' ? 'Другие документы' : 'Related documents';
  const otherKeys = (['terms', 'privacy', 'refund'] as LegalKey[]).filter((k) => k !== docKey);

  return (
    <div className="min-h-screen bg-background">
      <LanguageSwitcher variant="floating" />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <ChefHat className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
            Eatwise
          </span>
        </Link>

        <div className="bg-card rounded-xl p-6 sm:p-10" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {updatedLabel} {doc.updated}
          </p>

          <div className="mt-6 space-y-3">
            {doc.intro.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          <div className="mt-8 space-y-8">
            {doc.sections.map((section, i) => (
              <section key={i} className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {i + 1}. {section.heading}
                </h2>
                {section.body.map((item, j) => renderBody(item, j))}
              </section>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-foreground mb-2">{otherLabel}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {otherKeys.map((k) => (
              <Link key={k} href={`/${k}`} className="text-sm text-primary hover:underline">
                {labels[k]}
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
