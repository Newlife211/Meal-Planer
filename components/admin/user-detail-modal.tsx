'use client';

import { useEffect, useState } from 'react';
import { X, Crown, User as UserIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  subscriptionPeriodEnd: string | null;
  stripeCustomerId: string | null;
  planGenCount: number;
  replaceCount: number;
  isPremium: boolean;
  telegramLinked: boolean;
  telegram: { id: string; lang: string; createdAt: string } | null;
  profile: {
    age: number | null;
    gender: string | null;
    weight: number | null;
    height: number | null;
    activityLevel: string | null;
    goal: string | null;
    dietaryPreference: string | null;
    allergies: unknown;
    budget: number | null;
    currency: string | null;
    unitSystem: string | null;
    cookingTime: string | null;
    onboardingDone: boolean;
  } | null;
  _count: {
    mealPlans: number;
    shoppingLists: number;
    pantryItems: number;
    supportTickets: number;
  };
}

export function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (!res.ok) {
          if (active) setError(true);
          return;
        }
        const json = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const fmtDate = (iso: string | null) => {
    if (!iso) return t.admin.cardNone;
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(iso));
  };

  const genderLabel = (g: string | null) =>
    g ? ((t.genders as Record<string, string>)[g] ?? g) : t.admin.cardNone;
  const goalLabel = (g: string | null) =>
    g ? ((t.goals as Record<string, string>)[g] ?? g) : t.admin.cardNone;
  const dietLabel = (d: string | null) =>
    d ? ((t.diets as Record<string, string>)[d] ?? d) : t.admin.cardNone;
  const activityLabel = (a: string | null) =>
    a ? ((t.activityLevels as Record<string, { label: string }>)[a]?.label ?? a) : t.admin.cardNone;
  const cookingLabel = (c: string | null) =>
    c ? ((t.cookingTimes as Record<string, string>)[c] ?? c) : t.admin.cardNone;

  const allergyLabels = (raw: unknown): string => {
    const arr = Array.isArray(raw) ? raw : [];
    if (arr.length === 0) return t.admin.cardNone;
    return arr
      .map((a) => (t.allergies as Record<string, string>)[String(a)] ?? String(a))
      .join(', ');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-4 bg-card rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <UserIcon className="h-5 w-5 text-primary shrink-0" />
            <h2 className="font-semibold truncate">{t.admin.cardTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            aria-label={t.admin.cardClose}
            title={t.admin.cardClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error || !data ? (
            <div className="text-center py-16 text-muted-foreground">{t.admin.cardLoadError}</div>
          ) : (
            <div className="space-y-6">
              {/* Name + status */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-bold truncate">{data.name || t.admin.cardNone}</div>
                  <div className="text-sm text-muted-foreground truncate">{data.email}</div>
                </div>
                {data.isPremium ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    <Crown className="h-3.5 w-3.5" />
                    {data.subscriptionPlan === 'yearly' ? t.admin.yearlyPlan : t.admin.monthlyPlan}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {t.admin.freeLabel}
                  </span>
                )}
                {data.role === 'admin' && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                    {t.admin.adminBadge}
                  </span>
                )}
              </div>

              <Section title={t.admin.cardAccount}>
                <Row label={t.admin.cardName} value={data.name || t.admin.cardNone} />
                <Row label={t.admin.cardEmail} value={data.email} />
                <Row label={t.admin.cardRole} value={data.role} />
                <Row label={t.admin.cardUserId} value={data.id} mono />
                <Row label={t.admin.cardRegistered} value={fmtDate(data.createdAt)} />
                <Row label={t.admin.cardUpdated} value={fmtDate(data.updatedAt)} />
              </Section>

              <Section title={t.admin.cardSubscription}>
                <Row label={t.admin.cardStatus} value={data.subscriptionStatus} />
                <Row label={t.admin.cardPlan} value={data.subscriptionPlan || t.admin.cardNone} />
                <Row label={t.admin.cardPeriodEnd} value={fmtDate(data.subscriptionPeriodEnd)} />
                <Row
                  label={t.admin.cardStripeId}
                  value={data.stripeCustomerId || t.admin.cardNone}
                  mono
                />
              </Section>

              <Section title={t.admin.cardProfile}>
                {data.profile ? (
                  <>
                    <Row label={t.admin.cardAge} value={data.profile.age ?? t.admin.cardNone} />
                    <Row label={t.admin.cardGender} value={genderLabel(data.profile.gender)} />
                    <Row
                      label={t.admin.cardWeight}
                      value={data.profile.weight != null ? String(data.profile.weight) : t.admin.cardNone}
                    />
                    <Row
                      label={t.admin.cardHeight}
                      value={data.profile.height != null ? String(data.profile.height) : t.admin.cardNone}
                    />
                    <Row label={t.admin.cardActivity} value={activityLabel(data.profile.activityLevel)} />
                    <Row label={t.admin.cardGoal} value={goalLabel(data.profile.goal)} />
                    <Row label={t.admin.cardDiet} value={dietLabel(data.profile.dietaryPreference)} />
                    <Row label={t.admin.cardAllergies} value={allergyLabels(data.profile.allergies)} />
                    <Row
                      label={t.admin.cardBudget}
                      value={
                        data.profile.budget != null
                          ? `${data.profile.budget} ${data.profile.currency ?? ''}`.trim()
                          : t.admin.cardNone
                      }
                    />
                    <Row label={t.admin.cardCookingTime} value={cookingLabel(data.profile.cookingTime)} />
                    <Row
                      label={t.admin.cardOnboarding}
                      value={data.profile.onboardingDone ? t.admin.cardYes : t.admin.cardNo}
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t.admin.cardNoProfile}</p>
                )}
              </Section>

              <Section title={t.admin.cardActivity}>
                <Row label={t.admin.cardPlansCreated} value={data._count.mealPlans} />
                <Row label={t.admin.cardShoppingLists} value={data._count.shoppingLists} />
                <Row label={t.admin.cardPantryItems} value={data._count.pantryItems} />
                <Row label={t.admin.cardTickets} value={data._count.supportTickets} />
                <Row label={t.admin.cardGenCount} value={data.planGenCount} />
                <Row label={t.admin.cardReplaceCount} value={data.replaceCount} />
              </Section>

              <Section title={t.admin.cardTelegram}>
                <Row
                  label={t.admin.cardStatus}
                  value={data.telegramLinked ? t.admin.cardLinked : t.admin.cardNotLinked}
                />
                {data.telegram && (
                  <Row label={t.admin.cardRegistered} value={fmtDate(data.telegram.createdAt)} />
                )}
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </h3>
      <div className="rounded-xl border divide-y">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right break-all ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}
