'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { ChefHat, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/i18n/language-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LEGAL_LABELS } from '@/lib/legal/content';

export function LoginForm() {
  const { t, lang } = useLanguage();
  const legalLabels = LEGAL_LABELS[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(t.login.errInvalid);
      } else {
        window.location.href = '/meal-plan';
      }
    } catch {
      setError(t.login.errLogin);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <LanguageSwitcher variant="floating" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <ChefHat className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t.login.title}</h1>
          <p className="text-muted-foreground mt-1">{t.login.subtitle}</p>
        </div>

        <div className="bg-card rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t.login.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.login.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end -mt-1">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                {t.login.forgotPassword}
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.login.signingIn : t.login.signIn}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t.login.noAccount}{' '}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            {t.login.signUp}
          </Link>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-6 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {legalLabels.terms}
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {legalLabels.privacy}
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/refund" className="hover:text-foreground transition-colors">
            {legalLabels.refund}
          </Link>
        </div>
      </div>
    </div>
  );
}
