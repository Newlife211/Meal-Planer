'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChefHat, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/lib/i18n/language-provider';
import { ALLERGY_KEYS, CURRENCY_KEYS, CURRENCIES, formatMoney, type Currency } from '@/lib/i18n/translations';
import { LanguageSwitcher } from '@/components/language-switcher';
import { trackEvent } from '@/lib/analytics';

export function OnboardingFlow() {
  const { update } = useSession() || {};
  const router = useRouter();
  const { t, tf, locale, lang } = useLanguage();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    age: '',
    gender: '',
    weight: '',
    height: '',
    activityLevel: '',
    goal: '',
    dietaryPreference: '',
    allergies: [] as string[],
    allergyOther: '',
    budget: 5000,
    currency: 'RUB' as Currency,
    unitSystem: 'metric' as 'metric' | 'imperial',
    cookingTime: '',
  });

  // Soft-default currency & unit system from language until the user changes them.
  const prefsTouched = useRef(false);
  useEffect(() => {
    if (prefsTouched.current) return;
    const cur: Currency = lang === 'ru' ? 'RUB' : 'USD';
    setForm((prev: any) => ({
      ...prev,
      currency: cur,
      unitSystem: lang === 'ru' ? 'metric' : 'imperial',
      budget: CURRENCIES[cur].default,
    }));
  }, [lang]);

  // Track onboarding start once.
  const onboardingTracked = useRef(false);
  useEffect(() => {
    if (!onboardingTracked.current) {
      onboardingTracked.current = true;
      trackEvent('onboarding_start');
    }
  }, []);

  const STEPS = t.onboarding.steps;
  const GENDERS = [
    { value: 'male', label: t.genders.male },
    { value: 'female', label: t.genders.female },
  ];
  const ACTIVITY_LEVELS = [
    { value: 'sedentary', label: t.activityLevels.sedentary.label, desc: t.activityLevels.sedentary.desc },
    { value: 'moderate', label: t.activityLevels.moderate.label, desc: t.activityLevels.moderate.desc },
    { value: 'active', label: t.activityLevels.active.label, desc: t.activityLevels.active.desc },
    { value: 'very_active', label: t.activityLevels.very_active.label, desc: t.activityLevels.very_active.desc },
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

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleAllergy = (a: string) => {
    setForm((prev: any) => ({
      ...prev,
      allergies: prev.allergies?.includes(a)
        ? prev.allergies.filter((x: string) => x !== a)
        : [...(prev.allergies ?? []), a],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allergies = [
        ...(form.allergies ?? []),
        ...(form.allergyOther ? [form.allergyOther] : []),
      ];
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
          allergies,
          budget: form.budget,
          currency: form.currency,
          unitSystem: form.unitSystem,
          cookingTime: form.cookingTime || null,
          onboardingDone: true,
        }),
      });
      await update?.({ onboardingDone: true });
      trackEvent('onboarding_complete');
      window.location.href = '/meal-plan';
    } catch {
      setSaving(false);
    }
  };

  const SelectionCard = ({ selected, onClick, label, desc }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-transparent bg-muted hover:bg-muted/80'
      }`}
    >
      <span className="font-medium text-sm">{label}</span>
      {desc && <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>}
    </button>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.onboarding.step0Title}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.onboarding.age}</Label>
                <Input type="number" placeholder="25" value={form.age} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('age', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.onboarding.weight} ({form.unitSystem === 'imperial' ? t.measures.lb : t.measures.kg})</Label>
                <Input type="number" placeholder={form.unitSystem === 'imperial' ? '155' : '70'} value={form.weight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('weight', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.onboarding.height} ({form.unitSystem === 'imperial' ? t.measures.in : t.measures.cm})</Label>
                <Input type="number" placeholder={form.unitSystem === 'imperial' ? '69' : '175'} value={form.height} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('height', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.onboarding.unitSystem}</Label>
              <div className="grid grid-cols-2 gap-2">
                <SelectionCard selected={form.unitSystem === 'metric'} onClick={() => { prefsTouched.current = true; updateField('unitSystem', 'metric'); }} label={t.settings.metric} />
                <SelectionCard selected={form.unitSystem === 'imperial'} onClick={() => { prefsTouched.current = true; updateField('unitSystem', 'imperial'); }} label={t.settings.imperial} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.onboarding.gender}</Label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g: any) => (
                  <SelectionCard key={g.value} selected={form.gender === g.value} onClick={() => updateField('gender', g.value)} label={g.label} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.onboarding.activityLevel}</Label>
              <div className="grid gap-2">
                {ACTIVITY_LEVELS.map((a: any) => (
                  <SelectionCard key={a.value} selected={form.activityLevel === a.value} onClick={() => updateField('activityLevel', a.value)} label={a.label} desc={a.desc} />
                ))}
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.onboarding.step1Title}</h2>
            <div className="grid gap-2">
              {GOALS.map((g: any) => (
                <SelectionCard key={g.value} selected={form.goal === g.value} onClick={() => updateField('goal', g.value)} label={g.label} />
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.onboarding.step2Title}</h2>
            <div className="grid grid-cols-2 gap-2">
              {DIETS.map((d: any) => (
                <SelectionCard key={d.value} selected={form.dietaryPreference === d.value} onClick={() => updateField('dietaryPreference', d.value)} label={d.label} />
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.onboarding.step3Title}</h2>
            <div className="grid grid-cols-2 gap-2">
              {ALLERGY_KEYS.map((a) => (
                <SelectionCard key={a} selected={(form.allergies ?? []).includes(a)} onClick={() => toggleAllergy(a)} label={t.allergies[a]} />
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>{t.onboarding.allergyOther}</Label>
              <Input placeholder={t.onboarding.allergyOtherPlaceholder} value={form.allergyOther} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('allergyOther', e.target.value)} />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">{t.onboarding.step4Title}</h2>
            <div className="space-y-2">
              <Label>{t.onboarding.currency}</Label>
              <div className="grid grid-cols-2 gap-2">
                {CURRENCY_KEYS.map((c) => (
                  <SelectionCard
                    key={c}
                    selected={form.currency === c}
                    onClick={() => { prefsTouched.current = true; setForm((prev: any) => ({ ...prev, currency: c, budget: CURRENCIES[c].default })); }}
                    label={CURRENCIES[c].label}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold text-primary">{formatMoney(form.budget ?? CURRENCIES[form.currency].default, form.currency, locale)}</span>
              <span className="text-muted-foreground ml-1">{t.settings.perWeek}</span>
            </div>
            <Slider
              value={[form.budget ?? CURRENCIES[form.currency].default]}
              onValueChange={(val: number[]) => updateField('budget', val?.[0] ?? CURRENCIES[form.currency].default)}
              min={CURRENCIES[form.currency].min}
              max={CURRENCIES[form.currency].max}
              step={CURRENCIES[form.currency].step}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatMoney(CURRENCIES[form.currency].min, form.currency, locale)}</span>
              <span>{formatMoney(CURRENCIES[form.currency].max, form.currency, locale)}</span>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.onboarding.step5Title}</h2>
            <div className="grid grid-cols-2 gap-2">
              {COOKING_TIMES.map((ct: any) => (
                <SelectionCard key={ct.value} selected={form.cookingTime === ct.value} onClick={() => updateField('cookingTime', ct.value)} label={ct.label} />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <LanguageSwitcher variant="floating" />
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <ChefHat className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{tf(t.onboarding.stepOf, { n: step + 1, total: STEPS.length })} — {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="bg-card rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          {renderStep()}
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={() => setStep((s: number) => s - 1)} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t.common.back}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s: number) => s + 1)}>
              {t.common.next} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t.onboarding.saving : t.onboarding.done} <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
