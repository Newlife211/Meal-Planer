export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { extractGeoPayment, logSubscriptionEvent } from '@/lib/subscription-events';

// Backfills subscription "new" events for existing premium users that don't yet
// have one, pulling geography + payment method from Stripe. This lets the
// analytics section show historical data captured before event logging existed.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Users that ever had a Stripe subscription.
  const users = await prisma.user.findMany({
    where: { stripeSubscriptionId: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
    },
  });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const u of users) {
    try {
      // Skip users that already have a "new" event logged.
      const existing = await prisma.subscriptionEvent.findFirst({
        where: { eventType: 'new', userId: u.id },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }
      const gp = await extractGeoPayment({
        subscriptionId: u.stripeSubscriptionId,
        customerId: u.stripeCustomerId,
      });
      await logSubscriptionEvent({
        eventType: 'new',
        userId: u.id,
        email: u.email,
        name: u.name,
        plan: u.subscriptionPlan,
        status: u.subscriptionStatus,
        amount: gp.amount,
        currency: gp.currency,
        country: gp.country,
        paymentBrand: gp.paymentBrand,
        paymentType: gp.paymentType,
        cardLast4: gp.cardLast4,
        stripeSubscriptionId: u.stripeSubscriptionId,
        stripeCustomerId: u.stripeCustomerId,
      });
      created++;
    } catch (e: any) {
      console.error('backfill user error:', u.id, e?.message);
      failed++;
    }
  }

  return NextResponse.json({ scanned: users.length, created, skipped, failed });
}
