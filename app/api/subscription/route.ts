export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsageView } from '@/lib/subscription';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  try {
    const view = await getUsageView(session.user.id);
    return NextResponse.json(view);
  } catch (error: any) {
    console.error('Subscription view error:', error?.message);
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}
