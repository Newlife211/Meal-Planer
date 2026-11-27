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
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(profile ?? {});
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        age: body.age ?? undefined,
        gender: body.gender ?? undefined,
        weight: body.weight ?? undefined,
        height: body.height ?? undefined,
        activityLevel: body.activityLevel ?? undefined,
        goal: body.goal ?? undefined,
        dietaryPreference: body.dietaryPreference ?? undefined,
        allergies: body.allergies ?? undefined,
        budget: body.budget ?? undefined,
        currency: body.currency ?? undefined,
        unitSystem: body.unitSystem ?? undefined,
        cookingTime: body.cookingTime ?? undefined,
        onboardingDone: body.onboardingDone ?? undefined,
      },
      create: {
        userId: session.user.id,
        age: body.age,
        gender: body.gender,
        weight: body.weight,
        height: body.height,
        activityLevel: body.activityLevel,
        goal: body.goal,
        dietaryPreference: body.dietaryPreference,
        allergies: body.allergies ?? [],
        budget: body.budget,
        currency: body.currency ?? 'RUB',
        unitSystem: body.unitSystem ?? 'metric',
        cookingTime: body.cookingTime,
        onboardingDone: body.onboardingDone ?? false,
      },
    });
    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Ошибка обновления профиля' }, { status: 500 });
  }
}
