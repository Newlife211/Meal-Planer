'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Eye,
  Users,
  UserPlus,
  Globe,
  MousePointerClick,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';

interface Breakdown {
  key: string | null;
  count: number;
}
interface DailyPoint {
  date: string;
  visits: number;
  uniqueVisitors: number;
  newUsers: number;
}
interface Data {
  totals: {
    visitsToday: number;
    visits7d: number;
    visits30d: number;
    uniqueVisitors30d: number;
    newUsersToday: number;
    newUsers7d: number;
    newUsers30d: number;
  };
  daily: DailyPoint[];
  byCountry: Breakdown[];
  topPaths: Breakdown[];
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '\uD83C\uDFF3\uFE0F';
  const A = 0x1f1e6;
  const up = code.toUpperCase();
  return String.fromCodePoint(A + (up.charCodeAt(0) - 65), A + (up.charCodeAt(1) - 65));
}

const COUNTRY_NAMES: Record<string, { en: string; ru: string }> = {
  US: { en: 'United States', ru: '\u0421\u0428\u0410' },
  RU: { en: 'Russia', ru: '\u0420\u043E\u0441\u0441\u0438\u044F' },
  GB: { en: 'United Kingdom', ru: '\u0412\u0435\u043B\u0438\u043A\u043E\u0431\u0440\u0438\u0442\u0430\u043D\u0438\u044F' },
  DE: { en: 'Germany', ru: '\u0413\u0435\u0440\u043C\u0430\u043D\u0438\u044F' },
  FR: { en: 'France', ru: '\u0424\u0440\u0430\u043D\u0446\u0438\u044F' },
  KZ: { en: 'Kazakhstan', ru: '\u041A\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043D' },
  UA: { en: 'Ukraine', ru: '\u0423\u043A\u0440\u0430\u0438\u043D\u0430' },
  BY: { en: 'Belarus', ru: '\u0411\u0435\u043B\u0430\u0440\u0443\u0441\u044C' },
  CA: { en: 'Canada', ru: '\u041A\u0430\u043D\u0430\u0434\u0430' },
  AU: { en: 'Australia', ru: '\u0410\u0432\u0441\u0442\u0440\u0430\u043B\u0438\u044F' },
  IN: { en: 'India', ru: '\u0418\u043D\u0434\u0438\u044F' },
  PL: { en: 'Poland', ru: '\u041F\u043E\u043B\u044C\u0448\u0430' },
  ES: { en: 'Spain', ru: '\u0418\u0441\u043F\u0430\u043D\u0438\u044F' },
  IT: { en: 'Italy', ru: '\u0418\u0442\u0430\u043B\u0438\u044F' },
  NL: { en: 'Netherlands', ru: '\u041D\u0438\u0434\u0435\u0440\u043B\u0430\u043D\u0434\u044B' },
  TR: { en: 'Turkey', ru: '\u0422\u0443\u0440\u0446\u0438\u044F' },
  AE: { en: 'UAE', ru: '\u041E\u0410\u042D' },
  BR: { en: 'Brazil', ru: '\u0411\u0440\u0430\u0437\u0438\u043B\u0438\u044F' },
  KG: { en: 'Kyrgyzstan', ru: '\u041A\u044B\u0440\u0433\u044B\u0437\u0441\u0442\u0430\u043D' },
  UZ: { en: 'Uzbekistan', ru: '\u0423\u0437\u0431\u0435\u043A\u0438\u0441\u0442\u0430\u043D' },
  AM: { en: 'Armenia', ru: '\u0410\u0440\u043C\u0435\u043D\u0438\u044F' },
  AZ: { en: 'Azerbaijan', ru: '\u0410\u0437\u0435\u0440\u0431\u0430\u0439\u0434\u0436\u0430\u043D' },
  GE: { en: 'Georgia', ru: '\u0413\u0440\u0443\u0437\u0438\u044F' },
};

export function AdminAnalyticsClient() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tt = t.adminAnalytics;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/analytics');
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
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-center py-20 text-muted-foreground">{tt.loadError}</div>;
  }

  const countryName = (code: string) =>
    COUNTRY_NAMES[code]?.[lang === 'ru' ? 'ru' : 'en'] || code;

  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(iso + 'T00:00:00Z'));

  const maxVisits = Math.max(1, ...data.daily.map((d) => d.visits));
  const maxCountry = Math.max(1, ...data.byCountry.map((c) => c.count));
  const maxPath = Math.max(1, ...data.topPaths.map((p) => p.count));
  const totalCountry = data.byCountry.reduce((s, c) => s + c.count, 0);

  const cards = [
    { icon: Eye, label: tt.visitsToday, value: data.totals.visitsToday, color: 'text-blue-500' },
    { icon: Eye, label: tt.visits7d, value: data.totals.visits7d, color: 'text-indigo-500' },
    { icon: Users, label: tt.uniqueVisitors, value: data.totals.uniqueVisitors30d, color: 'text-cyan-600' },
    { icon: MousePointerClick, label: tt.visits30d, value: data.totals.visits30d, color: 'text-violet-500' },
    { icon: UserPlus, label: tt.newUsersToday, value: data.totals.newUsersToday, color: 'text-primary' },
    { icon: UserPlus, label: tt.newUsers7d, value: data.totals.newUsers7d, color: 'text-emerald-600' },
    { icon: UserPlus, label: tt.newUsers30d, value: data.totals.newUsers30d, color: 'text-amber-600' },
    { icon: Globe, label: tt.countries, value: data.byCountry.filter((c) => c.key).length, color: 'text-rose-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {tt.back}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-3">{tt.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{tt.subtitle}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-card rounded-xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <Icon className={`h-5 w-5 ${c.color}`} />
              <p className="text-2xl font-bold mt-2">{c.value.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Daily trend chart */}
      <div className="bg-card rounded-xl p-5 mb-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{tt.dailyTrend}</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
              {tt.visits}
            </span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-48">
          {data.daily.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '100%' }}>
                <div
                  className="w-full max-w-[16px] mx-auto rounded-t bg-primary/80 hover:bg-primary transition-colors"
                  style={{ height: `${(d.visits / maxVisits) * 100}%` }}
                />
              </div>
              <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-foreground text-background text-xs px-2.5 py-1.5 shadow-lg">
                <div className="font-semibold">{fmtDay(d.date)}</div>
                <div>{tt.visits}: {d.visits}</div>
                <div>{tt.uniqueVisitors}: {d.uniqueVisitors}</div>
                <div>{tt.newUsers}: {d.newUsers}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{fmtDay(data.daily[0]?.date)}</span>
          <span>{fmtDay(data.daily[data.daily.length - 1]?.date)}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By country */}
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-rose-500" />
            {tt.byCountry}
          </h2>
          {data.byCountry.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{tt.noData}</p>
          ) : (
            <div className="space-y-3">
              {data.byCountry.map((c, i) => {
                const code = c.key || '';
                const label = code ? `${countryFlag(code)} ${countryName(code)}` : tt.unknown;
                const pct = totalCountry > 0 ? Math.round((c.count / totalCountry) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="truncate">{label}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {c.count} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-400"
                        style={{ width: `${(c.count / maxCountry) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top pages */}
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-violet-500" />
            {tt.topPages}
          </h2>
          {data.topPaths.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{tt.noData}</p>
          ) : (
            <div className="space-y-3">
              {data.topPaths.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate font-mono text-xs">{p.key}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{p.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${(p.count / maxPath) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6">{tt.footnote}</p>
    </div>
  );
}
