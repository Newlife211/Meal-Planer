'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, Crown, Loader2, Settings } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';

interface UsageData {
  isPremium: boolean;
  status: string;
  plan: string | null;
  periodEnd: string | null;
  plans: { used: number; limit: number; resetAt: string | null };
  replaces: { used: number; limit: number; resetAt: string | null };
}

export function BillingClient() {
  const { t, lang, tf } = useLanguage();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) setUsage(await res.json());
    } catch (e: any) {
      console.error('Fetch subscription error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const fmtDate = (iso: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const upgrade = async () => {
    trackEvent('begin_checkout', { plan: period });
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: period }),
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(t.billing.errorGeneric);
    } catch (e: any) {
      console.error('Upgrade error:', e);
      setError(t.billing.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const manage = async () => {
    setManaging(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal-session', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(t.billing.errorGeneric);
    } catch (e: any) {
      console.error('Manage error:', e);
      setError(t.billing.errorGeneric);
    } finally {
      setManaging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const priceLabel =
    period === 'monthly' ? `$7.99${t.billing.perMonth}` : `$59.99${t.billing.perYear}`;

  const freeFeatures = [
    t.billing.freeFeatures.f1,
    t.billing.freeFeatures.f2,
    t.billing.freeFeatures.f3,
  ];
  const premiumFeatures = [
    t.billing.premiumFeatures.f1,
    t.billing.premiumFeatures.f2,
    t.billing.premiumFeatures.f3,
    t.billing.premiumFeatures.f4,
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">{t.billing.title}</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">{t.billing.subtitle}</p>

      {usage?.isPremium ? (
        <div
          className="bg-card rounded-2xl p-6 mb-6"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Crown className="h-5 w-5" />
            {t.billing.activeBadge}
          </div>
          {usage.periodEnd && (
            <p className="text-sm text-muted-foreground mt-2">
              {usage.status === 'trialing'
                ? tf(t.billing.trialActive, { date: fmtDate(usage.periodEnd) })
                : usage.status === 'canceled'
                ? tf(t.billing.accessUntil, { date: fmtDate(usage.periodEnd) })
                : tf(t.billing.renewsOn, { date: fmtDate(usage.periodEnd) })}
            </p>
          )}
          <Button className="mt-4" variant="outline" onClick={manage} disabled={managing}>
            {managing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            {t.billing.manage}
          </Button>
        </div>
      ) : (
        <>
          {/* Billing period toggle */}
          <div className="inline-flex items-center rounded-lg bg-muted p-0.5 mb-6">
            {(['monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {p === 'monthly' ? t.billing.monthly : t.billing.yearly}
                {p === 'yearly' && (
                  <span className="ml-1.5 text-xs text-primary font-semibold">
                    {t.billing.saveBadge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Free plan */}
            <div className="bg-card rounded-2xl p-6 border" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <h3 className="font-semibold">{t.billing.freeName}</h3>
              <p className="text-2xl font-bold mt-2">$0</p>
              <ul className="mt-4 space-y-2">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {usage && (
                <div className="mt-4 pt-4 border-t space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {tf(t.billing.plansUsage, { used: usage.plans.used, total: usage.plans.limit })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tf(t.billing.swapsUsage, { used: usage.replaces.used, total: usage.replaces.limit })}
                  </p>
                </div>
              )}
            </div>

            {/* Premium plan */}
            <div
              className="rounded-2xl p-6 border-2 border-primary bg-primary/5 relative"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t.billing.premiumName}</h3>
                <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-1">
                  {t.billing.trialBadge}
                </span>
              </div>
              <p className="text-3xl font-bold mt-2">{priceLabel}</p>
              {period === 'yearly' && (
                <p className="text-xs text-muted-foreground mt-1">{t.billing.billedYearly}</p>
              )}
              <ul className="mt-4 space-y-2">
                {premiumFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6" onClick={upgrade} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.billing.processing}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t.billing.cta}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {tf(t.billing.trialNote, { price: priceLabel })}
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {t.billing.billedUsd}
              </p>
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive mt-4">{error}</p>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-8 text-xs text-muted-foreground">
        <a href="/refund" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
          {lang === 'ru' ? 'Политика возвратов' : 'Refund Policy'}
        </a>
        <span aria-hidden="true">·</span>
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
          {lang === 'ru' ? 'Условия использования' : 'Terms of Service'}
        </a>
      </div>
    </div>
  );
}
