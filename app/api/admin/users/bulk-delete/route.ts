export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Bulk-delete user accounts (admin only). Related data (profile, meal plans,
// shopping lists, pantry items, support tickets) is removed via schema cascade.
// Any linked Telegram chats are unlinked so they no longer point at missing users.
// Self and admin accounts are always skipped for safety.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let ids: unknown;
  try {
    const body = await request.json();
    ids = body?.ids;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === 'string')) {
    return NextResponse.json({ error: 'invalid_ids' }, { status: 400 });
  }

  // Never delete the current admin or any admin account.
  const targets = await prisma.user.findMany({
    where: { id: { in: ids as string[] }, role: { not: 'admin' } },
    select: { id: true },
  });
  const deletableIds = targets
    .map((t) => t.id)
    .filter((id) => id !== session.user.id);

  if (deletableIds.length === 0) {
    return NextResponse.json({ deleted: 0, deletedIds: [] });
  }

  try {
    // Unlink any Telegram chats first (no FK relation, so they won't cascade).
    await prisma.telegramChat.updateMany({
      where: { userId: { in: deletableIds } },
      data: { userId: null },
    });
    await prisma.user.deleteMany({ where: { id: { in: deletableIds } } });
  } catch (err: any) {
    console.error('Failed to bulk-delete users:', err?.message);
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  return NextResponse.json({ deleted: deletableIds.length, deletedIds: deletableIds });
}
