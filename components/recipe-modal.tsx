'use client';

import { useState } from 'react';
import { X, Minus, Plus, ArrowLeftRight, Flame, Beef, Droplets, Wheat, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface PlanData {
  days: Array<{ day: string; meals: Meal[] }>;
}

interface Props {
  meal: Meal;
  onClose: () => void;
  planId: string | null;
  plan: PlanData | null;
  onPlanUpdate: (plan: PlanData) => void;
}

export function RecipeModal({ meal, onClose, planId, plan, onPlanUpdate }: Props) {
  const { t, lang } = useLanguage();
  const [servings, setServings] = useState(1);
  const [replacingIngredient, setReplacingIngredient] = useState<string | null>(null);
  const [replacement, setReplacement] = useState<{ original: string; replacement: string; amount: string; reason: string } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const scale = (val: number) => Math.round((val ?? 0) * servings);

  const replaceIngredient = async (ingredientName: string) => {
    setReplacingIngredient(ingredientName);
    setReplacement(null);
    try {
      const res = await fetch('/api/meal-plan/replace-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientName, mealName: meal?.name, lang }),
      });
      if (res.status === 403) {
        setShowUpgrade(true);
        setReplacingIngredient(null);
        return;
      }
      const data = await res.json();
      if (data?.replacement) {
        setReplacement(data);
      }
    } catch (e: any) {
      console.error('Replace ingredient error:', e);
    } finally {
      setReplacingIngredient(null);
    }
  };

  const mealTypeLabels: Record<string, string> = {
    breakfast: t.mealTypes.breakfast,
    lunch: t.mealTypes.lunch,
    dinner: t.mealTypes.dinner,
    snack: t.mealTypes.snack,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div className="sticky top-0 bg-background z-10 px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-primary">{mealTypeLabels[meal?.type ?? ''] ?? ''}</span>
              <h2 className="text-xl font-bold mt-1">{meal?.name ?? t.recipe.dishFallback}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* КБЖУ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <Flame className="h-4 w-4 text-orange-500 mx-auto" />
              <p className="text-lg font-bold mt-1">{scale(meal?.calories ?? 0)}</p>
              <p className="text-xs text-muted-foreground">{t.macros.kcal}</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <Beef className="h-4 w-4 text-red-500 mx-auto" />
              <p className="text-lg font-bold mt-1">{scale(meal?.protein ?? 0)}{t.units.g}</p>
              <p className="text-xs text-muted-foreground">{t.macros.protein}</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <Droplets className="h-4 w-4 text-yellow-500 mx-auto" />
              <p className="text-lg font-bold mt-1">{scale(meal?.fat ?? 0)}{t.units.g}</p>
              <p className="text-xs text-muted-foreground">{t.macros.fat}</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <Wheat className="h-4 w-4 text-amber-600 mx-auto" />
              <p className="text-lg font-bold mt-1">{scale(meal?.carbs ?? 0)}{t.units.g}</p>
              <p className="text-xs text-muted-foreground">{t.macros.carbs}</p>
            </div>
          </div>

          {/* Servings control */}
          <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{meal?.cookingTime ?? 0} {t.macros.min}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{t.recipe.servings}</span>
              <button
                onClick={() => setServings((s: number) => Math.max(1, s - 1))}
                className="w-7 h-7 rounded-full bg-background flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="font-bold text-lg w-6 text-center">{servings}</span>
              <button
                onClick={() => setServings((s: number) => s + 1)}
                className="w-7 h-7 rounded-full bg-background flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="font-semibold mb-3">{t.recipe.ingredients}</h3>
            <div className="space-y-2">
              {(meal?.ingredients ?? []).map((ing: Ingredient, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/50 group">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-sm">{ing?.name ?? ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{ing?.amount ?? ''}</span>
                    <button
                      onClick={() => replaceIngredient(ing?.name ?? '')}
                      disabled={replacingIngredient === (ing?.name ?? '')}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                      title={t.recipe.replaceIngredient}
                    >
                      {replacingIngredient === (ing?.name ?? '') ? (
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Replacement suggestion */}
          {replacement && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium">{t.recipe.replacementTitle}</p>
              <p className="text-sm mt-1">
                <span className="line-through text-muted-foreground">{replacement.original}</span>
                {' → '}
                <span className="font-medium text-primary">{replacement.replacement}</span>
                <span className="text-muted-foreground"> ({replacement.amount})</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{replacement.reason}</p>
            </div>
          )}

          {/* Recipe */}
          <div>
            <h3 className="font-semibold mb-3">{t.recipe.recipe}</h3>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {meal?.recipe ?? t.recipe.recipeEmpty}
            </div>
          </div>
        </div>
      </div>
      <UpgradeModal
        open={showUpgrade}
        reason={showUpgrade ? 'replace' : null}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}
