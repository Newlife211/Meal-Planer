'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';

interface Props {
  open: boolean;
  reason: 'plan' | 'replace' | null;
  onClose: () => void;
}

export function UpgradeModal({ open, reason, onClose }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  if (!open || !reason) return null;

  const title = reason === 'plan' ? t.billing.limitPlanTitle : t.billing.limitReplaceTitle;
  const desc = reason === 'plan' ? t.billing.limitPlanDesc : t.billing.limitReplaceDesc;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-background rounded-2xl w-full max-w-sm p-6 text-center"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{desc}</p>
        <div className="flex flex-col gap-2 mt-6">
          <Button
            onClick={() => {
              onClose();
              router.push('/billing');
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t.billing.cta}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t.billing.maybeLater}
          </Button>
        </div>
      </div>
    </div>
  );
}
