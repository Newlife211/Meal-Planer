'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChefHat, RefreshCw, Flame, Beef, Droplets, Wheat, Clock, ArrowLeftRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { RecipeModal } from '@/components/recipe-modal';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useLanguage } from '@/lib/i18n/language-provider';

interface Ingredient {
  name: string;
  amount: string;
}

interface Meal {
  type: string;
  name: string;
  ingredients: Ingredient[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cookingTime: number;
  recipe: string;
}

interface Day {
  day: string;
  meals: Meal[];
}

interface PlanData {
  days: Day[];
}

export function MealPlanClient() {
  const { t, tf, lang } = useLanguage();
  const mealTypeLabels: Record<string, string> = {
    breakfast: t.mealTypes.breakfast,
    lunch: t.mealTypes.lunch,
    dinner: t.mealTypes.dinner,
    snack: t.mealTypes.snack,
  };

  const [plan, setPlan] = useState<PlanData | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [replacingMeal, setReplacingMeal] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState<'plan' | 'replace' | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch('/api/meal-plan');
      const data = await res.json();
      if (data?.planData) {
        setPlan(data.planData as PlanData);
        setPlanId(data.id ?? null);
      }
    } catch (e: any) {
      console.error('Fetch plan error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const generatePlan = async () => {
    trackEvent('generate_meal_plan');
    setGenerating(true);
    setProgress(0);
    try {
      const res = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang }),
      });
      if (res.status === 403) {
        setShowUpgrade('plan');
        setGenerating(false);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? t.mealPlan.genError);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error(t.mealPlan.noBody);
      const decoder = new TextDecoder();
      let partialRead = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === 'processing') {
                setProgress((prev: number) => Math.min(prev + 2, 95));
              } else if (parsed?.status === 'completed') {
                setPlan(parsed.result as PlanData);
                setPlanId(parsed.planId ?? null);
                setProgress(100);
              } else if (parsed?.status === 'error') {
                console.error('Generation error:', parsed.message);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (error: any) {
      console.error('Generate error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const replaceMeal = async (dayIndex: number, mealIndex: number) => {
    const day = plan?.days?.[dayIndex];
    const meal = day?.meals?.[mealIndex];
    if (!meal) return;
    const key = `${dayIndex}-${mealIndex}`;
    setReplacingMeal(key);
    try {
      const res = await fetch('/api/meal-plan/replace-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType: meal.type, dayIndex, currentMeal: meal, lang }),
      });
      if (res.status === 403) {
        setShowUpgrade('replace');
        setReplacingMeal(null);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let partialRead = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed?.status === 'completed' && parsed?.result) {
                const newPlan = { ...(plan ?? { days: [] }) };
                const days = [...(newPlan.days ?? [])];
                const dayObj = { ...(days[dayIndex] ?? { day: '', meals: [] }) };
                const meals = [...(dayObj.meals ?? [])];
                meals[mealIndex] = { ...parsed.result, type: meal.type };
                dayObj.meals = meals;
                days[dayIndex] = dayObj;
                newPlan.days = days;
                setPlan(newPlan);
                if (planId) {
                  await fetch('/api/meal-plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId, planData: newPlan }),
                  });
                }
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (e: any) {
      console.error('Replace error:', e);
    } finally {
      setReplacingMeal(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-muted rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <ChefHat className="absolute inset-0 m-auto h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{t.mealPlan.generatingTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.mealPlan.generatingDesc}</p>
        </div>
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ChefHat className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold">{t.mealPlan.emptyTitle}</h2>
          <p className="text-muted-foreground mt-2">
            {t.mealPlan.emptyDesc}
          </p>
        </div>
        <Button onClick={generatePlan} size="lg">
          <ChefHat className="h-5 w-5 mr-2" />
          {t.mealPlan.generateBtn}
        </Button>
      </div>
    );
  }

  const days = plan?.days ?? [];
  const currentDay = days[selectedDay];
  const meals = currentDay?.meals ?? [];

  const totalCals = meals.reduce((s: number, m: Meal) => s + (m?.calories ?? 0), 0);
  const totalProtein = meals.reduce((s: number, m: Meal) => s + (m?.protein ?? 0), 0);
  const totalFat = meals.reduce((s: number, m: Meal) => s + (m?.fat ?? 0), 0);
  const totalCarbs = meals.reduce((s: number, m: Meal) => s + (m?.carbs ?? 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.mealPlan.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.mealPlan.subtitle}</p>
        </div>
        <Button onClick={generatePlan} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" /> {t.mealPlan.regenerate}
        </Button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6">
        {days.map((d: Day, i: number) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDay === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {d?.day ?? tf(t.mealPlan.dayFallback, { n: i + 1 })}
          </button>
        ))}
      </div>

      {/* Daily summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-xl p-4 flex items-center gap-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Flame className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">{t.macros.kcal}</p>
            <p className="font-bold">{totalCals}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 flex items-center gap-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Beef className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">{t.macros.protein}</p>
            <p className="font-bold">{totalProtein}{t.units.g}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 flex items-center gap-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Droplets className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">{t.macros.fat}</p>
            <p className="font-bold">{totalFat}{t.units.g}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 flex items-center gap-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Wheat className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-xs text-muted-foreground">{t.macros.carbs}</p>
            <p className="font-bold">{totalCarbs}{t.units.g}</p>
          </div>
        </div>
      </div>

      {/* Meals grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {meals.map((meal: Meal, idx: number) => (
          <div
            key={idx}
            className="bg-card rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow group"
            style={{ boxShadow: 'var(--shadow-sm)' }}
            onClick={() => setSelectedMeal(meal)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="text-xs font-medium text-primary">
                  {mealTypeLabels[meal?.type ?? ''] ?? meal?.type ?? ''}
                </span>
                <h3 className="font-semibold mt-1 group-hover:text-primary transition-colors">
                  {meal?.name ?? t.mealPlan.dishFallback}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" /> {meal?.calories ?? 0} {t.macros.kcal}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {meal?.cookingTime ?? 0} {t.macros.min}
                  </span>
                </div>
                <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>{t.macros.proteinShort}: {meal?.protein ?? 0}{t.units.g}</span>
                  <span>{t.macros.fatShort}: {meal?.fat ?? 0}{t.units.g}</span>
                  <span>{t.macros.carbsShort}: {meal?.carbs ?? 0}{t.units.g}</span>
                </div>
              </div>
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  replaceMeal(selectedDay, idx);
                }}
                disabled={replacingMeal === `${selectedDay}-${idx}`}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                title={t.mealPlan.replaceMeal}
              >
                {replacingMeal === `${selectedDay}-${idx}` ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowLeftRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedMeal && (
        <RecipeModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          planId={planId}
          plan={plan}
          onPlanUpdate={(newPlan: PlanData) => setPlan(newPlan)}
        />
      )}
      <UpgradeModal
        open={showUpgrade !== null}
        reason={showUpgrade}
        onClose={() => setShowUpgrade(null)}
      />
    </div>
  );
}
