export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Only "new" subscription events reflect actual sign-ups by geo / method.
  const newFilter = { eventType: 'new' as const };

  const [
    totalEvents,
    newCount,
    canceledCount,
    failedCount,
    new30,
    byCountryRaw,
    byBrandRaw,
    byPlanRaw,
    recentEvents,
  ] = await Promise.all([
    prisma.subscriptionEvent.count(),
    prisma.subscriptionEvent.count({ where: newFilter }),
    prisma.subscriptionEvent.count({ where: { eventType: 'canceled' } }),
    prisma.subscriptionEvent.count({ where: { eventType: 'payment_failed' } }),
    prisma.subscriptionEvent.count({ where: { ...newFilter, createdAt: { gte: thirtyAgo } } }),
    prisma.subscriptionEvent.groupBy({
      by: ['country'],
      where: newFilter,
      _count: { _all: true },
    }),
    prisma.subscriptionEvent.groupBy({
      by: ['paymentBrand'],
      where: newFilter,
      _count: { _all: true },
    }),
    prisma.subscriptionEvent.groupBy({
      by: ['plan'],
      where: newFilter,
      _count: { _all: true },
    }),
    prisma.subscriptionEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        eventType: true,
        email: true,
        name: true,
        plan: true,
        amount: true,
        currency: true,
        country: true,
        paymentBrand: true,
        paymentType: true,
        cardLast4: true,
        createdAt: true,
      },
    }),
  ]);

  const mapCount = (
    rows: Array<{ _count: { _all: number } }>,
    key: string
  ) =>
    rows
      .map((r: any) => ({ key: r[key] ?? null, count: r._count._all }))
      .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    totals: {
      totalEvents,
      newCount,
      canceledCount,
      failedCount,
      new30,
    },
    byCountry: mapCount(byCountryRaw, 'country'),
    byPaymentBrand: mapCount(byBrandRaw, 'paymentBrand'),
    byPlan: mapCount(byPlanRaw, 'plan'),
    recentEvents,
  });
}
