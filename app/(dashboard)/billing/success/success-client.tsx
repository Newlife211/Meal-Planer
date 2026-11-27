'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';

export function SuccessClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') ?? null;
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!sessionId) {
        setVerifying(false);
        return;
      }
      try {
        await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (e: any) {
        console.error('Verify error:', e);
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      {verifying ? (
        <>
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground">{t.billing.verifying}</p>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <div className="max-w-md">
            <h1 className="text-2xl font-bold">{t.billing.successTitle}</h1>
            <p className="text-muted-foreground mt-2">{t.billing.successDesc}</p>
          </div>
          <Button size="lg" onClick={() => router.push('/meal-plan')}>
            <Sparkles className="h-5 w-5 mr-2" />
            {t.billing.successCta}
          </Button>
        </>
      )}
    </div>
  );
}
