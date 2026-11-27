export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Full account details for the customer card (admin only).
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionPeriodEnd: true,
      stripeCustomerId: true,
      planGenCount: true,
      replaceCount: true,
      profile: {
        select: {
          age: true,
          gender: true,
          weight: true,
          height: true,
          activityLevel: true,
          goal: true,
          dietaryPreference: true,
          allergies: true,
          budget: true,
          currency: true,
          unitSystem: true,
          cookingTime: true,
          onboardingDone: true,
        },
      },
      _count: {
        select: {
          mealPlans: true,
          shoppingLists: true,
          pantryItems: true,
          supportTickets: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const telegram = await prisma.telegramChat.findUnique({
    where: { userId: params.id },
    select: { id: true, lang: true, createdAt: true },
  });

  const now = new Date();
  const isPremium =
    (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') &&
    (!user.subscriptionPeriodEnd || user.subscriptionPeriodEnd.getTime() >= now.getTime());

  return NextResponse.json({ ...user, isPremium, telegramLinked: !!telegram, telegram });
}

// Delete a user account (admin only). Related data (profile, meal plans,
// shopping lists, pantry items, support tickets) is removed via schema cascade.
// Any linked Telegram chat is unlinked so it no longer points at a missing user.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetId = params.id;

  // Safety: an admin cannot delete their own account.
  if (targetId === session.user.id) {
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Safety: admin accounts cannot be deleted from here.
  if (target.role === 'admin') {
    return NextResponse.json({ error: 'cannot_delete_admin' }, { status: 400 });
  }

  try {
    // Unlink any Telegram chat first (no FK relation, so it won't cascade).
    await prisma.telegramChat.updateMany({
      where: { userId: targetId },
      data: { userId: null },
    });
    await prisma.user.delete({ where: { id: targetId } });
  } catch (err: any) {
    console.error('Failed to delete user:', err?.message);
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
