export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

// Opens the Stripe Billing Portal so the user can manage/cancel their subscription.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  try {
    const origin =
      request.headers.get('origin') || process.env.NEXTAUTH_URL || '';
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'Нет активной подписки' }, { status: 400 });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/profile`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error: any) {
    console.error('Portal session error:', error?.message);
    return NextResponse.json({ error: 'Не удалось открыть управление подпиской' }, { status: 500 });
  }
}
