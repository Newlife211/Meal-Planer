export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const todayStart = startOfDayUTC(now);
  const dayMs = 24 * 60 * 60 * 1000;
  const day7 = new Date(todayStart.getTime() - 6 * dayMs); // inclusive 7-day window
  const day30 = new Date(todayStart.getTime() - 29 * dayMs); // inclusive 30-day window

  const [
    visitsToday,
    visits7d,
    visits30d,
    uniqueVisitors30dRows,
    newUsersToday,
    newUsers7d,
    newUsers30d,
    visitsByDay,
    usersByDay,
    byCountryRaw,
    topPathsRaw,
  ] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.pageView.count({ where: { createdAt: { gte: day7 } } }),
    prisma.pageView.count({ where: { createdAt: { gte: day30 } } }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: day30 }, visitorId: { not: null } },
      distinct: ['visitorId'],
      select: { visitorId: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: day7 } } }),
    prisma.user.count({ where: { createdAt: { gte: day30 } } }),
    prisma.$queryRaw<Array<{ day: Date; visits: bigint; uniques: bigint }>>`
      SELECT date_trunc('day', created_at) AS day,
             count(*) AS visits,
             count(distinct visitor_id) AS uniques
      FROM page_views
      WHERE created_at >= ${day30}
      GROUP BY day
      ORDER BY day
    `,
    prisma.$queryRaw<Array<{ day: Date; c: bigint }>>`
      SELECT date_trunc('day', created_at) AS day, count(*) AS c
      FROM users
      WHERE created_at >= ${day30}
      GROUP BY day
      ORDER BY day
    `,
    prisma.pageView.groupBy({
      by: ['country'],
      where: { createdAt: { gte: day30 } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: day30 } },
      _count: { _all: true },
    }),
  ]);

  // Build a continuous 30-day daily series (fill gaps with zeros).
  const visitMap = new Map<string, { visits: number; uniques: number }>();
  for (const r of visitsByDay) {
    visitMap.set(ymd(new Date(r.day)), { visits: Number(r.visits), uniques: Number(r.uniques) });
  }
  const userMap = new Map<string, number>();
  for (const r of usersByDay) {
    userMap.set(ymd(new Date(r.day)), Number(r.c));
  }
  const daily: Array<{ date: string; visits: number; uniqueVisitors: number; newUsers: number }> = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(day30.getTime() + i * dayMs);
    const key = ymd(d);
    const v = visitMap.get(key);
    daily.push({
      date: key,
      visits: v?.visits ?? 0,
      uniqueVisitors: v?.uniques ?? 0,
      newUsers: userMap.get(key) ?? 0,
    });
  }

  const byCountry = byCountryRaw
    .map((r: any) => ({ key: r.country ?? null, count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const topPaths = topPathsRaw
    .map((r: any) => ({ key: r.path ?? '/', count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return NextResponse.json({
    totals: {
      visitsToday,
      visits7d,
      visits30d,
      uniqueVisitors30d: uniqueVisitors30dRows.length,
      newUsersToday,
      newUsers7d,
      newUsers30d,
    },
    daily,
    byCountry,
    topPaths,
  });
}
