'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, Plus, Send, MessageSquare, ChevronLeft } from 'lucide-react';
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
  messages: Msg[];
}

export function SupportClient() {
  const { t, lang } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/support');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
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
    s === 'answered' ? t.support.statusAnswered : s === 'closed' ? t.support.statusClosed : t.support.statusOpen;

  const statusClass = (s: string) =>
    s === 'answered'
      ? 'text-green-700 bg-green-100'
      : s === 'closed'
      ? 'text-muted-foreground bg-muted'
      : 'text-amber-700 bg-amber-100';

  const active = tickets.find((tk) => tk.id === activeId) || null;

  const submitNew = async () => {
    setError('');
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      if (!res.ok) {
        setError(t.support.createdError);
        return;
      }
      const data = await res.json();
      setTickets((prev) => [data.ticket, ...prev]);
      setSubject('');
      setMessage('');
      setActiveId(data.ticket.id);
      setView('detail');
    } catch {
      setError(t.support.createdError);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async () => {
    if (!reply.trim() || !active) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/${active.id}/messages`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LifeBuoy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.support.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t.support.subtitle}</p>
          </div>
        </div>
        {view === 'list' && (
          <button
            onClick={() => {
              setError('');
              setView('new');
            }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="h-4 w-4" />
            {t.support.newRequest}
          </button>
        )}
      </div>

      {/* New request form */}
      {view === 'new' && (
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <button
            onClick={() => setView('list')}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.support.backToList}
          </button>
          <h2 className="font-semibold mb-4">{t.support.newRequestTitle}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.support.subject}</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.support.subjectPlaceholder}
                maxLength={200}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.support.message}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.support.messagePlaceholder}
                rows={6}
                maxLength={5000}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={submitNew}
              disabled={submitting || !subject.trim() || !message.trim()}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? t.support.sending : t.support.send}
            </button>
          </div>
        </div>
      )}

      {/* Ticket list */}
      {view === 'list' && (
        <div>
          <h2 className="font-semibold mb-3">{t.support.yourRequests}</h2>
          {tickets.length === 0 ? (
            <div className="bg-card rounded-xl p-10 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{t.support.noRequests}</p>
              <p className="text-muted-foreground text-xs mt-1">{t.support.empty}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((tk) => (
                <button
                  key={tk.id}
                  onClick={() => {
                    setActiveId(tk.id);
                    setReply('');
                    setView('detail');
                  }}
                  className="w-full text-left bg-card rounded-xl p-4 hover:bg-muted/40 transition-colors"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium truncate">{tk.subject}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', statusClass(tk.status))}>
                      {statusLabel(tk.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {tk.messages[tk.messages.length - 1]?.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{fmtDate(tk.updatedAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket detail / conversation */}
      {view === 'detail' && active && (
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <button
            onClick={() => {
              setView('list');
              setActiveId(null);
            }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.support.backToList}
          </button>
          <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b">
            <h2 className="font-semibold">{active.subject}</h2>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', statusClass(active.status))}>
              {statusLabel(active.status)}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            {active.messages.map((m) => (
              <div key={m.id} className={cn('flex', m.isAdmin ? 'justify-start' : 'justify-end')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5',
                    m.isAdmin ? 'bg-muted text-foreground rounded-tl-sm' : 'bg-primary text-primary-foreground rounded-tr-sm'
                  )}
                >
                  <p className="text-xs font-semibold mb-0.5 opacity-80">
                    {m.isAdmin ? t.support.team : t.support.you}
                  </p>
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="text-[10px] mt-1 opacity-70">{fmtDate(m.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          {active.status !== 'closed' && (
            <div className="flex items-end gap-2 pt-3 border-t">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t.support.replyPlaceholder}
                rows={2}
                maxLength={5000}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
              <button
                onClick={submitReply}
                disabled={replying || !reply.trim()}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
              >
                <Send className="h-4 w-4" />
                {replying ? t.support.sending : t.support.sendReply}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
