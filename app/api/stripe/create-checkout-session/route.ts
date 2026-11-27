export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, PLANS, BILLING_CURRENCY, PlanKey, TRIAL_PERIOD_DAYS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Оплата временно недоступна' }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const planKey: PlanKey = body?.plan === 'yearly' ? 'yearly' : 'monthly';
    const plan = PLANS[planKey];

    const origin =
      request.headers.get('origin') || process.env.NEXTAUTH_URL || '';

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: BILLING_CURRENCY,
            unit_amount: plan.amount,
            recurring: { interval: plan.interval },
            product_data: { name: plan.productName },
          },
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing`,
      metadata: { userId: user.id, plan: planKey },
      subscription_data: {
        metadata: { userId: user.id, plan: planKey },
        ...(TRIAL_PERIOD_DAYS > 0 ? { trial_period_days: TRIAL_PERIOD_DAYS } : {}),
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error('Create checkout session error:', error?.message);
    return NextResponse.json({ error: 'Не удалось создать сессию оплаты' }, { status: 500 });
  }
}
