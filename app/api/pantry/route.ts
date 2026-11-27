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
  const items = await prisma.pantryItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body?.name || !body?.quantity || !body?.unit) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
    }
    const item = await prisma.pantryItem.create({
      data: {
        userId: session.user.id,
        name: body.name,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Pantry create error:', error);
    return NextResponse.json({ error: 'Ошибка добавления' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }
    await prisma.pantryItem.deleteMany({
      where: { id, userId: session.user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Pantry delete error:', error);
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }
    const item = await prisma.pantryItem.updateMany({
      where: { id: body.id, userId: session.user.id },
      data: {
        name: body.name,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    });
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Pantry update error:', error);
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 });
  }
}
