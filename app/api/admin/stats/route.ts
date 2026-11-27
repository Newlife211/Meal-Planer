export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const MONTHLY_PRICE = 7.99;
const YEARLY_PRICE = 59.99;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const activeFilter = {
    subscriptionStatus: { in: ['active', 'trialing'] },
    OR: [
      { subscriptionPeriodEnd: null },
      { subscriptionPeriodEnd: { gte: now } },
    ],
  };

  const [
    totalUsers,
    newUsersWeek,
    newUsers30,
    activeSubs,
    monthlySubs,
    yearlySubs,
    canceledSubs,
    totalPlans,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyAgo } } }),
    prisma.user.count({ where: activeFilter }),
    prisma.user.count({ where: { ...activeFilter, subscriptionPlan: 'monthly' } }),
    prisma.user.count({ where: { ...activeFilter, subscriptionPlan: 'yearly' } }),
    prisma.user.count({ where: { subscriptionStatus: 'canceled' } }),
    prisma.mealPlan.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionPeriodEnd: true,
      },
    }),
  ]);

  // Estimated Monthly Recurring Revenue (USD)
  const mrr = monthlySubs * MONTHLY_PRICE + yearlySubs * (YEARLY_PRICE / 12);
  const conversionRate = totalUsers > 0 ? (activeSubs / totalUsers) * 100 : 0;

  return NextResponse.json({
    totalUsers,
    newUsersWeek,
    newUsers30,
    activeSubs,
    monthlySubs,
    yearlySubs,
    canceledSubs,
    freeUsers: totalUsers - activeSubs,
    totalPlans,
    mrr: Math.round(mrr * 100) / 100,
    conversionRate: Math.round(conversionRate * 10) / 10,
    recentUsers: recentUsers.map((u: any) => {
      const active =
        (u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing') &&
        (!u.subscriptionPeriodEnd || u.subscriptionPeriodEnd.getTime() >= now.getTime());
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isSelf: u.id === session.user.id,
        createdAt: u.createdAt,
        isPremium: active,
        plan: active ? u.subscriptionPlan : null,
      };
    }),
  });
}
