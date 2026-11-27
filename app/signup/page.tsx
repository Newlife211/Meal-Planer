import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SignupForm } from './signup-form';

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/meal-plan');
  return <SignupForm />;
}
