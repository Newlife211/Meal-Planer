export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import {
  applyStripeSubscription,
  subscriptionPeriodEndUnix,
  subscriptionPlanKey,
} from '@/lib/subscription';

// Called on the success page after Checkout redirect. Retrieves the session and
// activates the subscription in our DB immediately (so the app works even before
// webhooks are configured). Idempotent.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const sessionId = body?.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: 'Не указана сессия' }, { status: 400 });
    }

    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (checkout?.metadata?.userId && checkout.metadata.userId !== session.user.id) {
      return NextResponse.json({ error: 'Сессия не принадлежит пользователю' }, { status: 403 });
    }

    const paid =
      checkout?.status === 'complete' || checkout?.payment_status === 'paid';
    const sub: any = checkout?.subscription;

    if (paid && sub && typeof sub === 'object') {
      await applyStripeSubscription({
        userId: session.user.id,
        subscriptionId: sub.id,
        status: sub.status || 'active',
        plan: subscriptionPlanKey(sub) || (checkout?.metadata?.plan ?? null),
        periodEndUnix: subscriptionPeriodEndUnix(sub),
        customerId: typeof checkout.customer === 'string' ? checkout.customer : null,
      });
      return NextResponse.json({ active: true });
    }

    return NextResponse.json({ active: false });
  } catch (error: any) {
    console.error('Verify session error:', error?.message);
    return NextResponse.json({ error: 'Не удалось подтвердить оплату' }, { status: 500 });
  }
}
