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
  const plans = await prisma.mealPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      isActive: true,
      createdAt: true,
      planData: true,
    },
  });
  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { planId } = body ?? {};
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID обязателен' }, { status: 400 });
    }
    // Deactivate all
    await prisma.mealPlan.updateMany({
      where: { userId: session.user.id, isActive: true },
      data: { isActive: false },
    });
    // Activate chosen
    await prisma.mealPlan.updateMany({
      where: { id: planId, userId: session.user.id },
      data: { isActive: true },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Restore plan error:', error);
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}
