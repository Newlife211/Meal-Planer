export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  const plan = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(plan ?? null);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  try {
    const body = await request.json();
    // Update plan data (for meal replacements)
    if (body?.planId && body?.planData) {
      const plan = await prisma.mealPlan.updateMany({
        where: { id: body.planId, userId: session.user.id },
        data: { planData: body.planData },
      });
      return NextResponse.json(plan);
    }
    return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
  } catch (error: any) {
    console.error('Meal plan update error:', error);
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}
