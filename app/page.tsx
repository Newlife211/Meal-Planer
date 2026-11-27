import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LandingPage } from '@/components/landing-page';
import { StructuredData } from '@/components/structured-data';
import { getSiteUrl } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/meal-plan');
  }
  return (
    <>
      <StructuredData siteUrl={getSiteUrl()} />
      <LandingPage />
    </>
  );
}
