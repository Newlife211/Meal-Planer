'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChefHat, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/i18n/language-provider';
import { LanguageSwitcher } from '@/components/language-switcher';

export function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t.resetPassword.errShort);
      return;
    }
    if (password !== confirm) {
      setError(t.resetPassword.errMismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data?.error === 'INVALID_TOKEN') {
        setError(t.resetPassword.errInvalidToken);
      } else if (data?.error === 'WEAK_PASSWORD') {
        setError(t.resetPassword.errShort);
      } else {
        setError(t.resetPassword.errServer);
      }
    } catch {
      setError(t.resetPassword.errServer);
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
          <h1 className="text-2xl font-bold tracking-tight">{t.resetPassword.title}</h1>
          <p className="text-muted-foreground mt-1">{t.resetPassword.subtitle}</p>
        </div>

        <div className="bg-card rounded-xl p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          {done ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="font-semibold text-lg">{t.resetPassword.successTitle}</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-5">{t.resetPassword.successDesc}</p>
              <Button className="w-full" onClick={() => router.push('/login')}>
                {t.resetPassword.successCta}
              </Button>
            </div>
          ) : !token ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">{t.resetPassword.missingToken}</p>
              <Link href="/forgot-password" className="text-primary text-sm font-medium hover:underline mt-3 inline-block">
                {t.forgotPassword.title}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">{t.resetPassword.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t.resetPassword.passwordPlaceholder}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t.resetPassword.confirm}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder={t.resetPassword.passwordPlaceholder}
                    value={confirm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.resetPassword.updating : t.resetPassword.submit}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-4">
          <Link href="/login" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t.forgotPassword.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}
