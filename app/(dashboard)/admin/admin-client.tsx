'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Crown,
  DollarSign,
  TrendingUp,
  UserPlus,
  CalendarClock,
  ClipboardList,
  XCircle,
  Inbox,
  ChevronRight,
  Trash2,
  BarChart3,
  ExternalLink,
  CreditCard,
  Activity,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { UserDetailModal } from '@/components/admin/user-detail-modal';

interface RecentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isSelf: boolean;
  createdAt: string;
  isPremium: boolean;
  plan: string | null;
}

interface Stats {
  totalUsers: number;
  newUsersWeek: number;
  newUsers30: number;
  activeSubs: number;
  monthlySubs: number;
  yearlySubs: number;
  canceledSubs: number;
  freeUsers: number;
  totalPlans: number;
  mrr: number;
  conversionRate: number;
  recentUsers: RecentUser[];
}

export function AdminClient() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async (deletableIds: string[]) => {
    const ids = deletableIds.filter((id) => selectedIds.has(id));
    if (ids.length === 0) return;
    if (!window.confirm(t.admin.bulkDeleteConfirm.replace('{n}', String(ids.length)))) return;
    setBulkDeleting(true);
    try {
      const res = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        alert(t.admin.bulkDeleteError);
        return;
      }
      const data = await res.json();
      const removed: string[] = Array.isArray(data?.deletedIds) ? data.deletedIds : ids;
      const removedSet = new Set(removed);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totalUsers: Math.max(0, prev.totalUsers - removed.length),
              freeUsers: Math.max(
                0,
                prev.freeUsers -
                  prev.recentUsers.filter((u) => removedSet.has(u.id) && !u.isPremium).length
              ),
              recentUsers: prev.recentUsers.filter((u) => !removedSet.has(u.id)),
            }
          : prev
      );
      setSelectedIds(new Set());
    } catch {
      alert(t.admin.bulkDeleteError);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDelete = async (user: RecentUser) => {
    if (!window.confirm(t.admin.deleteConfirm)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert(t.admin.deleteError);
        return;
      }
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totalUsers: Math.max(0, prev.totalUsers - 1),
              freeUsers: user.isPremium ? prev.freeUsers : Math.max(0, prev.freeUsers - 1),
              recentUsers: prev.recentUsers.filter((u) => u.id !== user.id),
            }
          : prev
      );
    } catch {
      alert(t.admin.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) {
          setError(true);
          return;
        }
        setStats(await res.json());
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

  if (error || !stats) {
    return (
      <div className="text-center py-20 text-muted-foreground">{t.admin.loadError}</div>
    );
  }

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(v);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(iso));

  const selectableIds = stats.recentUsers
    .filter((u) => !u.isSelf && u.role !== 'admin')
    .map((u) => u.id);
  const selectedCount = selectableIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = selectableIds.length > 0 && selectedCount === selectableIds.length;

  const cards = [
    { icon: Users, label: t.admin.totalUsers, value: stats.totalUsers, color: 'text-blue-500' },
    { icon: Crown, label: t.admin.activeSubs, value: stats.activeSubs, color: 'text-primary' },
    { icon: DollarSign, label: t.admin.mrr, value: fmtMoney(stats.mrr), color: 'text-green-600' },
    { icon: TrendingUp, label: t.admin.conversion, value: `${stats.conversionRate}%`, color: 'text-amber-600' },
    { icon: UserPlus, label: t.admin.newWeek, value: stats.newUsersWeek, color: 'text-indigo-500' },
    { icon: CalendarClock, label: t.admin.new30, value: stats.newUsers30, color: 'text-cyan-600' },
    { icon: ClipboardList, label: t.admin.totalPlans, value: stats.totalPlans, color: 'text-orange-500' },
    { icon: XCircle, label: t.admin.canceled, value: stats.canceledSubs, color: 'text-red-500' },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.admin.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.admin.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-orange-500" />
            Google Analytics
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
          <a
            href="https://dashboard.stripe.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
          >
            <CreditCard className="h-4 w-4 text-indigo-500" />
            Stripe
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
          <a
            href="https://yookassa.ru/my/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
          >
            <Wallet className="h-4 w-4 text-emerald-600" />
            ЮKassa
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
          >
            <Activity className="h-4 w-4 text-blue-500" />
            {t.adminAnalytics.navLabel}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/admin/subscriptions"
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
          >
            <CreditCard className="h-4 w-4 text-purple-500" />
            {t.adminSubs.navLabel}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/admin/support"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Inbox className="h-4 w-4" />
            {t.adminSupport.title}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-card rounded-xl p-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <Icon className={`h-5 w-5 ${c.color}`} />
              <p className="text-2xl font-bold mt-2">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Subscription breakdown */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-sm text-muted-foreground">{t.admin.monthlyPlan}</p>
          <p className="text-xl font-bold mt-1">{stats.monthlySubs}</p>
        </div>
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-sm text-muted-foreground">{t.admin.yearlyPlan}</p>
          <p className="text-xl font-bold mt-1">{stats.yearlySubs}</p>
        </div>
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <p className="text-sm text-muted-foreground">{t.admin.freeUsers}</p>
          <p className="text-xl font-bold mt-1">{stats.freeUsers}</p>
        </div>
      </div>

      {/* Recent users */}
      <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-semibold">{t.admin.recentUsers}</h2>
          {selectableIds.length > 0 && selectedCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {t.admin.selectedLabel.replace('{n}', String(selectedCount))}
              </span>
              <button
                onClick={() => handleBulkDelete(selectableIds)}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {bulkDeleting ? t.admin.bulkDeleting : t.admin.bulkDelete}
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium w-8">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-red-600 cursor-pointer align-middle"
                    aria-label={t.admin.selectAll}
                    title={t.admin.selectAll}
                    disabled={selectableIds.length === 0}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedCount > 0 && !allSelected;
                    }}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? new Set(selectableIds) : new Set())
                    }
                  />
                </th>
                <th className="pb-2 font-medium">{t.admin.colUser}</th>
                <th className="pb-2 font-medium">{t.admin.colStatus}</th>
                <th className="pb-2 font-medium text-right">{t.admin.colJoined}</th>
                <th className="pb-2 font-medium text-right">{t.admin.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u) => {
                const deletable = !u.isSelf && u.role !== 'admin';
                const selected = selectedIds.has(u.id);
                return (
                <tr
                  key={u.id}
                  onDoubleClick={() => setDetailUserId(u.id)}
                  className={`border-b last:border-0 transition-colors cursor-pointer hover:bg-muted/60 ${
                    selected ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="py-2.5">
                    {deletable ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-red-600 cursor-pointer align-middle"
                        aria-label={t.admin.deleteUser}
                        checked={selected}
                        onChange={() => toggleSelect(u.id)}
                      />
                    ) : null}
                  </td>
                  <td className="py-2.5">
                    <div className="font-medium">{u.name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="py-2.5">
                    {u.isPremium ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Crown className="h-3 w-3" />
                        {u.plan === 'yearly' ? t.admin.yearlyPlan : t.admin.monthlyPlan}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {t.admin.freeLabel}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  <td className="py-2.5 text-right">
                    {u.isSelf ? (
                      <span className="text-xs text-muted-foreground">{t.admin.youBadge}</span>
                    ) : u.role === 'admin' ? (
                      <span className="text-xs text-muted-foreground">{t.admin.adminBadge}</span>
                    ) : (
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                        title={t.admin.deleteUser}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === u.id ? t.admin.deleting : t.admin.deleteUser}
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detailUserId && (
        <UserDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />
      )}
    </div>
  );
}
