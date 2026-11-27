'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, RotateCcw, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/language-provider';

interface HistoryPlan {
  id: string;
  isActive: boolean;
  createdAt: string;
  planData: any;
}

export function HistoryClient() {
  const { t, tf, locale } = useLanguage();
  const [plans, setPlans] = useState<HistoryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const restorePlan = async (planId: string) => {
    setRestoring(planId);
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      toast.success(t.history.toastRestored);
      fetchHistory();
    } catch (e: any) {
      console.error(e);
      toast.error(t.history.toastError);
    } finally {
      setRestoring(null);
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t.history.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.history.subtitle}</p>
      </div>

      {(plans ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t.history.emptyTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.history.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(plans ?? []).map((plan: HistoryPlan) => {
            const days = (plan?.planData as any)?.days ?? [];
            const totalMeals = days.reduce((s: number, d: any) => s + ((d?.meals ?? []).length ?? 0), 0);
            return (
              <div
                key={plan.id}
                className={`bg-card rounded-xl px-5 py-4 flex items-center justify-between ${
                  plan?.isActive ? 'ring-2 ring-primary' : ''
                }`}
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan?.isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {tf(t.history.planFrom, { date: new Date(plan?.createdAt ?? '').toLocaleDateString(locale, { timeZone: 'UTC' }) })}
                      </p>
                      {plan?.isActive && (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                          <CheckCircle className="h-3 w-3" /> {t.history.active}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tf(t.history.daysMeals, { days: days?.length ?? 0, meals: totalMeals })}
                    </p>
                  </div>
                </div>
                {!plan?.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restorePlan(plan.id)}
                    disabled={restoring === plan.id}
                  >
                    {restoring === plan.id ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-1" />
                    )}
                    {t.history.restore}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
