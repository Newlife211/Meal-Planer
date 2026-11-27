import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminAnalyticsClient } from './analytics-client';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'admin') redirect('/meal-plan');
  return <AdminAnalyticsClient />;
}
