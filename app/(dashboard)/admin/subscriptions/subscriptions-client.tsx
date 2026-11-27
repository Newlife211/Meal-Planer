'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Globe,
  CreditCard,
  RefreshCw,
  Crown,
  XCircle,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';

interface Breakdown {
  key: string | null;
  count: number;
}
interface RecentEvent {
  id: string;
  eventType: string;
  email: string | null;
  name: string | null;
  plan: string | null;
  amount: number | null;
  currency: string | null;
  country: string | null;
  paymentBrand: string | null;
  paymentType: string | null;
  cardLast4: string | null;
  createdAt: string;
}
interface Data {
  totals: {
    totalEvents: number;
    newCount: number;
    canceledCount: number;
    failedCount: number;
    new30: number;
  };
  byCountry: Breakdown[];
  byPaymentBrand: Breakdown[];
  byPlan: Breakdown[];
  recentEvents: RecentEvent[];
}

// Minimal ISO-2 country code -> flag emoji.
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '🏳️';
  const A = 0x1f1e6;
  const up = code.toUpperCase();
  return String.fromCodePoint(A + (up.charCodeAt(0) - 65), A + (up.charCodeAt(1) - 65));
}

const COUNTRY_NAMES: Record<string, { en: string; ru: string }> = {
  US: { en: 'United States', ru: 'США' },
  RU: { en: 'Russia', ru: 'Россия' },
  GB: { en: 'United Kingdom', ru: 'Великобритания' },
  DE: { en: 'Germany', ru: 'Германия' },
  FR: { en: 'France', ru: 'Франция' },
  KZ: { en: 'Kazakhstan', ru: 'Казахстан' },
  UA: { en: 'Ukraine', ru: 'Украина' },
  BY: { en: 'Belarus', ru: 'Беларусь' },
  CA: { en: 'Canada', ru: 'Канада' },
  AU: { en: 'Australia', ru: 'Австралия' },
  IN: { en: 'India', ru: 'Индия' },
  PL: { en: 'Poland', ru: 'Польша' },
  ES: { en: 'Spain', ru: 'Испания' },
  IT: { en: 'Italy', ru: 'Италия' },
  NL: { en: 'Netherlands', ru: 'Нидерланды' },
  TR: { en: 'Turkey', ru: 'Турция' },
  AE: { en: 'UAE', ru: 'ОАЭ' },
  BR: { en: 'Brazil', ru: 'Бразилия' },
};

export function AdminSubscriptionsClient() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);

  const tt = t.adminSubs;

  const load = async () => {
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (!res.ok) {
        setError(true);
        return;
      }
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBackfill = async () => {
    setBackfilling(true);
    setBackfillMsg(null);
    try {
      const res = await fetch('/api/admin/subscriptions/backfill', { method: 'POST' });
      if (!res.ok) {
        setBackfillMsg(tt.backfillError);
        return;
      }
      const d = await res.json();
      setBackfillMsg(
        tt.backfillDone
          .replace('{created}', String(d.created ?? 0))
          .replace('{skipped}', String(d.skipped ?? 0))
          .replace('{failed}', String(d.failed ?? 0))
      );
      await load();
    } catch {
      setBackfillMsg(tt.backfillError);
    } finally {
      setBackfilling(false);
    }
  };

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    }).format(new Date(iso));

  const fmtAmount = (amount: number | null, currency: string | null) => {
    if (amount == null) return '—';
    const v = amount / 100;
    try {
      return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 2,
      }).format(v);
    } catch {
      return `${v.toFixed(2)} ${currency || ''}`.trim();
    }
  };

  const countryLabel = (code: string | null) => {
    if (!code) return tt.unknown;
    const name = COUNTRY_NAMES[code.toUpperCase()];
    const flag = countryFlag(code);
    return `${flag} ${name ? (lang === 'ru' ? name.ru : name.en) : code.toUpperCase()}`;
  };

  const brandLabel = (brand: string | null) => {
    if (!brand) return tt.unknown;
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const planLabel = (plan: string | null) => {
    if (plan === 'monthly') return t.admin.monthlyPlan;
    if (plan === 'yearly') return t.admin.yearlyPlan;
    return tt.unknown;
  };

  const eventTypeLabel = (type: string) => {
    switch (type) {
      case 'new':
        return tt.evNew;
      case 'renewal':
        return tt.evRenewal;
      case 'canceled':
        return tt.evCanceled;
      case 'payment_failed':
        return tt.evFailed;
      default:
        return type;
    }
  };

  const eventTypeColor = (type: string) => {
    switch (type) {
      case 'new':
        return 'bg-green-100 text-green-700';
      case 'renewal':
        return 'bg-blue-100 text-blue-700';
      case 'canceled':
        return 'bg-red-100 text-red-700';
      case 'payment_failed':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const BarList = ({
    icon: Icon,
    title,
    rows,
    labeler,
    color,
  }: {
    icon: any;
    title: string;
    rows: Breakdown[];
    labeler: (k: string | null) => string;
    color: string;
  }) => {
    const total = rows.reduce((s, r) => s + r.count, 0);
    return (
      <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`h-4 w-4 ${color}`} />
          <h2 className="font-semibold text-sm">{title}</h2>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{tt.noData}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => {
              const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{labeler(r.key)}</span>
                    <span className="text-muted-foreground">
                      {r.count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          {tt.back}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tt.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{tt.subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleBackfill}
              disabled={backfilling}
              className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${backfilling ? 'animate-spin' : ''}`} />
              {backfilling ? tt.backfilling : tt.backfill}
            </button>
            {backfillMsg && (
              <p className="text-xs text-muted-foreground max-w-[220px] text-right">{backfillMsg}</p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">{tt.loading}</div>
      ) : error ? (
        <div className="py-20 text-center text-red-500">{tt.loadError}</div>
      ) : !data ? null : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-card rounded-xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <Crown className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold mt-2">{data.totals.newCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tt.totalNew}</p>
            </div>
            <div className="bg-card rounded-xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <CalendarClock className="h-5 w-5 text-cyan-600" />
              <p className="text-2xl font-bold mt-2">{data.totals.new30}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tt.new30}</p>
            </div>
            <div className="bg-card rounded-xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-2xl font-bold mt-2">{data.totals.canceledCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tt.totalCanceled}</p>
            </div>
            <div className="bg-card rounded-xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-2xl font-bold mt-2">{data.totals.failedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tt.totalFailed}</p>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <BarList
              icon={Globe}
              title={tt.byCountry}
              rows={data.byCountry}
              labeler={countryLabel}
              color="text-blue-500"
            />
            <BarList
              icon={CreditCard}
              title={tt.byPaymentBrand}
              rows={data.byPaymentBrand}
              labeler={brandLabel}
              color="text-purple-500"
            />
            <BarList
              icon={Crown}
              title={tt.byPlan}
              rows={data.byPlan}
              labeler={planLabel}
              color="text-primary"
            />
          </div>

          {/* Recent events */}
          <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <h2 className="font-semibold mb-4">{tt.recentEvents}</h2>
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{tt.noData}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-2 font-medium">{tt.colEvent}</th>
                      <th className="py-2 font-medium">{tt.colUser}</th>
                      <th className="py-2 font-medium">{tt.colCountry}</th>
                      <th className="py-2 font-medium">{tt.colMethod}</th>
                      <th className="py-2 font-medium">{tt.colPlan}</th>
                      <th className="py-2 font-medium text-right">{tt.colAmount}</th>
                      <th className="py-2 font-medium text-right">{tt.colDate}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEvents.map((e) => (
                      <tr key={e.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${eventTypeColor(
                              e.eventType
                            )}`}
                          >
                            {eventTypeLabel(e.eventType)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="font-medium truncate max-w-[160px]">{e.name || '—'}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {e.email || '—'}
                          </div>
                        </td>
                        <td className="py-2.5">{countryLabel(e.country)}</td>
                        <td className="py-2.5">
                          {e.paymentBrand ? (
                            <span>
                              {brandLabel(e.paymentBrand)}
                              {e.cardLast4 ? (
                                <span className="text-muted-foreground"> ••{e.cardLast4}</span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{tt.unknown}</span>
                          )}
                        </td>
                        <td className="py-2.5">{planLabel(e.plan)}</td>
                        <td className="py-2.5 text-right">{fmtAmount(e.amount, e.currency)}</td>
                        <td className="py-2.5 text-right text-muted-foreground whitespace-nowrap">
                          {fmtDate(e.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
