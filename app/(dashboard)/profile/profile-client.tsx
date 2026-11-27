'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/language-provider';
import { ALLERGY_KEYS, CURRENCY_KEYS, CURRENCIES, formatMoney, type Currency } from '@/lib/i18n/translations';

export function ProfileClient() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    age: '',
    gender: '',
    weight: '',
    height: '',
    activityLevel: '',
    goal: '',
    dietaryPreference: '',
    allergies: [],
    budget: 5000,
    currency: 'RUB',
    unitSystem: 'metric',
    cookingTime: '',
  });

  const ACTIVITY_LEVELS = [
    { value: 'sedentary', label: t.activityLevels.sedentary.label },
    { value: 'moderate', label: t.activityLevels.moderate.label },
    { value: 'active', label: t.activityLevels.active.label },
    { value: 'very_active', label: t.activityLevels.very_active.label },
  ];

  const GOALS = [
    { value: 'lose', label: t.goals.lose },
    { value: 'gain', label: t.goals.gain },
    { value: 'maintain', label: t.goals.maintain },
  ];

  const DIETS = [
    { value: 'regular', label: t.diets.regular },
    { value: 'vegetarian', label: t.diets.vegetarian },
    { value: 'vegan', label: t.diets.vegan },
    { value: 'gluten_free', label: t.diets.gluten_free },
    { value: 'keto', label: t.diets.keto },
    { value: 'other', label: t.diets.other },
  ];

  const COOKING_TIMES = [
    { value: '15', label: t.cookingTimes['15'] },
    { value: '30', label: t.cookingTimes['30'] },
    { value: '60', label: t.cookingTimes['60'] },
    { value: '60+', label: t.cookingTimes['60+'] },
  ];

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data && !data.error) {
        setForm({
          age: data.age ?? '',
          gender: data.gender ?? '',
          weight: data.weight ?? '',
          height: data.height ?? '',
          activityLevel: data.activityLevel ?? '',
          goal: data.goal ?? '',
          dietaryPreference: data.dietaryPreference ?? '',
          allergies: Array.isArray(data.allergies) ? data.allergies : [],
          budget: data.budget ?? CURRENCIES[(data.currency as Currency) ?? 'RUB']?.default ?? 5000,
          currency: (data.currency as Currency) ?? 'RUB',
          unitSystem: data.unitSystem ?? 'metric',
          cookingTime: data.cookingTime ?? '',
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleAllergy = (a: string) => {
    setForm((prev: any) => ({
      ...prev,
      allergies: (prev.allergies ?? []).includes(a)
        ? (prev.allergies ?? []).filter((x: string) => x !== a)
        : [...(prev.allergies ?? []), a],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(form.age) || null,
          gender: form.gender || null,
          weight: parseFloat(form.weight) || null,
          height: parseFloat(form.height) || null,
          activityLevel: form.activityLevel || null,
          goal: form.goal || null,
          dietaryPreference: form.dietaryPreference || null,
          allergies: form.allergies ?? [],
          budget: form.budget,
          currency: form.currency,
          unitSystem: form.unitSystem,
          cookingTime: form.cookingTime || null,
        }),
      });
      toast.success(t.profile.toastSaved);
    } catch {
      toast.error(t.profile.toastError);
    } finally {
      setSaving(false);
    }
  };

  const SelectionCard = ({ selected, onClick, label }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.profile.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.profile.subtitle}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Demographics */}
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> {t.profile.dataSection}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.profile.age}</Label>
              <Input type="number" value={form.age} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('age', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.measures.weight} ({form.unitSystem === 'imperial' ? t.measures.lb : t.measures.kg})</Label>
              <Input type="number" value={form.weight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('weight', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.measures.height} ({form.unitSystem === 'imperial' ? t.measures.in : t.measures.cm})</Label>
              <Input type="number" value={form.height} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('height', e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <Label>{t.settings.units}</Label>
            <div className="flex gap-2 mt-1.5">
              <SelectionCard selected={form.unitSystem === 'metric'} onClick={() => updateField('unitSystem', 'metric')} label={t.settings.metric} />
              <SelectionCard selected={form.unitSystem === 'imperial'} onClick={() => updateField('unitSystem', 'imperial')} label={t.settings.imperial} />
            </div>
          </div>
          <div className="mt-3">
            <Label>{t.profile.gender}</Label>
            <div className="flex gap-2 mt-1.5">
              <SelectionCard selected={form.gender === 'male'} onClick={() => updateField('gender', 'male')} label={t.genders.male} />
              <SelectionCard selected={form.gender === 'female'} onClick={() => updateField('gender', 'female')} label={t.genders.female} />
            </div>
          </div>
          <div className="mt-3">
            <Label>{t.profile.activity}</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {ACTIVITY_LEVELS.map((a: any) => (
                <SelectionCard key={a.value} selected={form.activityLevel === a.value} onClick={() => updateField('activityLevel', a.value)} label={a.label} />
              ))}
            </div>
          </div>
        </div>

        {/* Goal & Diet */}
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="font-semibold mb-4">{t.profile.goalDietSection}</h3>
          <div className="space-y-3">
            <div>
              <Label>{t.profile.goal}</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {GOALS.map((g: any) => (
                  <SelectionCard key={g.value} selected={form.goal === g.value} onClick={() => updateField('goal', g.value)} label={g.label} />
                ))}
              </div>
            </div>
            <div>
              <Label>{t.profile.dietType}</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {DIETS.map((d: any) => (
                  <SelectionCard key={d.value} selected={form.dietaryPreference === d.value} onClick={() => updateField('dietaryPreference', d.value)} label={d.label} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="font-semibold mb-4">{t.profile.allergiesSection}</h3>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_KEYS.map((key) => (
              <SelectionCard key={key} selected={(form.allergies ?? []).includes(key)} onClick={() => toggleAllergy(key)} label={t.allergies[key]} />
            ))}
          </div>
        </div>

        {/* Budget & Cooking time */}
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="font-semibold mb-4">{t.profile.budgetTimeSection}</h3>
          <div className="space-y-4">
            <div>
              <Label>{t.settings.currency}</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {CURRENCY_KEYS.map((c) => (
                  <SelectionCard
                    key={c}
                    selected={form.currency === c}
                    onClick={() => setForm((prev: any) => ({ ...prev, currency: c, budget: CURRENCIES[c].default }))}
                    label={CURRENCIES[c].label}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <Label>{t.profile.budget}</Label>
                <span className="text-sm font-medium text-primary">{formatMoney(form.budget ?? CURRENCIES[form.currency as Currency].default, form.currency as Currency, locale)} {t.settings.perWeek}</span>
              </div>
              <Slider
                value={[form.budget ?? CURRENCIES[form.currency as Currency].default]}
                onValueChange={(val: number[]) => updateField('budget', val?.[0] ?? CURRENCIES[form.currency as Currency].default)}
                min={CURRENCIES[form.currency as Currency].min}
                max={CURRENCIES[form.currency as Currency].max}
                step={CURRENCIES[form.currency as Currency].step}
                className="mt-2"
              />
            </div>
            <div>
              <Label>{t.profile.cookingTime}</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {COOKING_TIMES.map((ct: any) => (
                  <SelectionCard key={ct.value} selected={form.cookingTime === ct.value} onClick={() => updateField('cookingTime', ct.value)} label={ct.label} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? t.profile.saving : t.profile.save}
          </Button>
          <Button variant="outline" onClick={() => router.push('/meal-plan')}>
            <RefreshCw className="h-4 w-4 mr-1" /> {t.profile.regeneratePlan}
          </Button>
        </div>
      </div>
    </div>
  );
}
