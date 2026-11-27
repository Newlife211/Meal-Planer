'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Send, Inbox } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { cn } from '@/lib/utils';

interface Msg {
  id: string;
  isAdmin: boolean;
  body: string;
  createdAt: string;
}
interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string };
  messages: Msg[];
}

type Filter = 'open' | 'answered' | 'closed' | 'all';

export function AdminSupportClient() {
  const { t, lang } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('open');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/support');
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(iso));

  const statusLabel = (s: string) =>
    s === 'answered' ? t.adminSupport.statusAnswered : s === 'closed' ? t.adminSupport.statusClosed : t.adminSupport.statusOpen;

  const statusClass = (s: string) =>
    s === 'answered'
      ? 'text-green-700 bg-green-100'
      : s === 'closed'
      ? 'text-muted-foreground bg-muted'
      : 'text-amber-700 bg-amber-100';

  const openCount = useMemo(() => tickets.filter((tk) => tk.status === 'open').length, [tickets]);

  const filtered = useMemo(
    () => (filter === 'all' ? tickets : tickets.filter((tk) => tk.status === filter)),
    [tickets, filter]
  );

  const active = tickets.find((tk) => tk.id === activeId) || null;

  const submitReply = async () => {
    if (!reply.trim() || !active) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/support/${active.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) => prev.map((tk) => (tk.id === data.ticket.id ? data.ticket : tk)));
        setReply('');
      }
    } finally {
      setReplying(false);
    }
  };

  const changeStatus = async (status: string) => {
    if (!active) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/support/${active.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setTickets((prev) => prev.map((tk) => (tk.id === active.id ? { ...tk, status } : tk)));
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-muted-foreground">{t.adminSupport.loadError}</div>;
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'open', label: t.adminSupport.open },
    { key: 'answered', label: t.adminSupport.answered },
    { key: 'closed', label: t.adminSupport.closed },
    { key: 'all', label: t.adminSupport.all },
  ];

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.adminSupport.backToAdmin}
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Inbox className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {t.adminSupport.title}
            {openCount > 0 && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {openCount} {t.adminSupport.openBadge}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t.adminSupport.subtitle}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setActiveId(null);
            }}
            className={cn(
              'text-sm px-3 py-1.5 rounded-lg font-medium transition-colors',
              filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Ticket list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-card rounded-xl p-10 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{t.adminSupport.noTickets}</p>
            </div>
          ) : (
            filtered.map((tk) => (
              <button
                key={tk.id}
                onClick={() => {
                  setActiveId(tk.id);
                  setReply('');
                }}
                className={cn(
                  'w-full text-left bg-card rounded-xl p-4 transition-colors',
                  activeId === tk.id ? 'ring-2 ring-primary' : 'hover:bg-muted/40'
                )}
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium truncate">{tk.subject}</span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', statusClass(tk.status))}>
                    {statusLabel(tk.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tk.user.name || tk.user.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {tk.messages[tk.messages.length - 1]?.body}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{fmtDate(tk.updatedAt)}</p>
              </button>
            ))
          )}
        </div>

        {/* Conversation panel */}
        <div>
          {!active ? (
            <div className="bg-card rounded-xl p-10 text-center h-full flex flex-col items-center justify-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <p className="text-muted-foreground text-sm">{t.adminSupport.select}</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="pb-4 border-b mb-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{active.subject}</h2>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', statusClass(active.status))}>
                    {statusLabel(active.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.adminSupport.from}: {active.user.name ? `${active.user.name} · ` : ''}{active.user.email}
                </p>
              </div>

              <div className="space-y-3 mb-4 max-h-[340px] overflow-y-auto">
                {active.messages.map((m) => (
                  <div key={m.id} className={cn('flex', m.isAdmin ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5',
                        m.isAdmin ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'
                      )}
                    >
                      <p className="text-xs font-semibold mb-0.5 opacity-80">
                        {m.isAdmin ? t.adminSupport.you : active.user.name || t.adminSupport.user}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="text-[10px] mt-1 opacity-70">{fmtDate(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {active.status !== 'closed' ? (
                <div className="pt-3 border-t space-y-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={t.adminSupport.replyPlaceholder}
                    rows={3}
                    maxLength={5000}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => changeStatus('closed')}
                      disabled={updatingStatus}
                      className="text-sm px-3 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {t.adminSupport.markClosed}
                    </button>
                    <button
                      onClick={submitReply}
                      disabled={replying || !reply.trim()}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {replying ? t.adminSupport.sending : t.adminSupport.sendReply}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t">
                  <button
                    onClick={() => changeStatus('open')}
                    disabled={updatingStatus}
                    className="text-sm px-3 py-2 rounded-lg font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {t.adminSupport.reopen}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
